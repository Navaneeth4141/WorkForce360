import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { calculateContractInvoice } from '../services/invoiceService.js';
import { generateInvoicePdf } from '../services/pdfService.js';

const prisma = new PrismaClient();

const STORAGE_DIR = path.resolve('storage');
const INVOICES_DIR = path.join(STORAGE_DIR, 'invoices');

/**
 * POST /api/invoices/generate
 * Generates client invoice preview for a contract and payroll batch
 */
export async function generateInvoice(req, res) {
  const { contractId, payrollBatchId } = req.body;

  if (!contractId || !payrollBatchId) {
    return res.status(400).json({ error: { message: 'Contract ID and Payroll Batch ID are required' } });
  }

  try {
    // 1. Fetch Contract, Client and Payroll Batch details
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, isActive: true },
      include: { client: true },
    });

    if (!contract) {
      return res.status(404).json({ error: { message: 'Active contract not found' } });
    }

    const payrollBatch = await prisma.payrollBatch.findUnique({
      where: { id: payrollBatchId },
    });

    if (!payrollBatch) {
      return res.status(404).json({ error: { message: 'Payroll batch not found' } });
    }

    // 2. Check if invoice already exists and is frozen
    const existingInvoice = await prisma.invoiceBatch.findFirst({
      where: { contractId, payrollBatchId },
    });

    if (existingInvoice && existingInvoice.isFrozen) {
      return res.status(400).json({
        error: { message: 'Invoice for this contract and payroll batch is already generated and frozen.' },
      });
    }

    // 3. Find all employees assigned to this contract
    const employees = await prisma.employee.findMany({
      where: { currentContractId: contractId, isActive: true },
    });

    if (employees.length === 0) {
      return res.status(400).json({
        error: { message: 'No employees are currently assigned to this contract.' },
      });
    }

    const employeeIds = employees.map(emp => emp.id);

    // 4. Fetch payroll items for these employees from the specified payroll batch
    const payrollItems = await prisma.payrollItem.findMany({
      where: {
        payrollBatchId,
        employeeId: { in: employeeIds },
      },
    });

    if (payrollItems.length === 0) {
      return res.status(400).json({
        error: { message: 'No payroll records found for the assigned employees in this payroll batch.' },
      });
    }

    // 5. Calculate invoice figures (Section 14)
    const calc = calculateContractInvoice({
      employeePayrollItems: payrollItems,
      serviceChargePercentage: parseFloat(contract.serviceChargePercentage),
      cgstPercentage: parseFloat(contract.cgstPercentage),
      sgstPercentage: parseFloat(contract.sgstPercentage),
    });

    // 6. Run database transaction to create invoice
    const result = await prisma.$transaction(async (tx) => {
      // Delete old preview if it exists
      if (existingInvoice) {
        await tx.invoiceItem.deleteMany({ where: { invoiceBatchId: existingInvoice.id } });
        await tx.invoiceBatch.delete({ where: { id: existingInvoice.id } });
      }

      // Generate invoice number: INV-YEAR-MONTH-CONTRACT_PREFIX
      const dateCode = `${payrollBatch.payrollYear}${String(payrollBatch.payrollMonth).padStart(2, '0')}`;
      const contractPrefix = contract.contractName.replace(/\s+/g, '').substring(0, 4).toUpperCase();
      
      // Check if invoice number is unique, append serial if needed
      let invoiceNumber = `INV-${contractPrefix}-${dateCode}`;
      const duplicateNo = await tx.invoiceBatch.findUnique({ where: { invoiceNumber } });
      if (duplicateNo) {
        invoiceNumber = `${invoiceNumber}-${contractId.substring(0, 4)}`;
      }

      // Save Invoice Batch Header
      const invoice = await tx.invoiceBatch.create({
        data: {
          contractId,
          payrollBatchId,
          invoiceNumber,
          invoiceDate: new Date(),
          totalInvoiceAmount: calc.totalAmount,
          isFrozen: false,
          createdBy: req.user.id,
        },
      });

      // Save Invoice Items
      const invoiceItem = await tx.invoiceItem.create({
        data: {
          invoiceBatchId: invoice.id,
          payrollCost: calc.payrollCost,
          employerPf: calc.employerPf,
          employerPfAdmin: calc.employerPfAdmin,
          employerEsic: calc.employerEsic,
          serviceCharge: calc.serviceCharge,
          cgstAmount: calc.cgstAmount,
          sgstAmount: calc.sgstAmount,
          totalAmount: calc.totalAmount,
        },
      });

      // Log action
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'Invoice Generated',
          entityType: 'InvoiceBatch',
          entityId: invoice.id,
          description: `Generated invoice ${invoiceNumber} for client ${contract.client.companyName} with base CTC Rs. ${calc.invoiceBase}`,
        },
      });

      return { invoice, item: invoiceItem };
    });

    return res.json({
      message: 'Invoice preview generated successfully',
      invoice: result.invoice,
      item: result.item,
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return res.status(500).json({ error: { message: error.message || 'Internal server error generating invoice' } });
  }
}

/**
 * POST /api/invoices/freeze
 * Freezes client invoice and generates PDF invoice
 */
export async function freezeInvoice(req, res) {
  const { invoiceId } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ error: { message: 'Invoice ID is required' } });
  }

  try {
    const invoice = await prisma.invoiceBatch.findUnique({
      where: { id: invoiceId },
      include: {
        contract: {
          include: { client: true },
        },
        invoiceItems: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: { message: 'Invoice not found' } });
    }

    if (invoice.isFrozen) {
      return res.json({ message: 'Invoice is already frozen', invoice });
    }

    const settings = await prisma.setting.findFirst();

    // 1. Create storage directories if they do not exist
    await fs.mkdir(INVOICES_DIR, { recursive: true });

    // 2. Process and Freeze in a transaction
    await prisma.$transaction(async (tx) => {
      // Set batch frozen state
      await tx.invoiceBatch.update({
        where: { id: invoiceId },
        data: { isFrozen: true, updatedBy: req.user.id },
      });

      // Generate PDF Invoice
      const pdfBuffer = await generateInvoicePdf({
        invoiceBatch: invoice,
        contract: invoice.contract,
        client: invoice.contract.client,
        setting: settings,
        invoiceItems: invoice.invoiceItems,
      });

      // Save PDF file locally
      const fileName = `invoice-${invoice.id}.pdf`;
      const filePath = path.join(INVOICES_DIR, fileName);
      await fs.writeFile(filePath, pdfBuffer);

      // Store relative download URL in database
      const relativeUrl = `/storage/invoices/${fileName}`;
      await tx.invoiceBatch.update({
        where: { id: invoiceId },
        data: { pdfUrl: relativeUrl },
      });

      // Log action
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'Invoice Frozen',
          entityType: 'InvoiceBatch',
          entityId: invoiceId,
          description: `Locked client invoice ${invoice.invoiceNumber} and generated PDF`,
        },
      });
    });

    return res.json({ message: 'Invoice successfully frozen and PDF generated' });
  } catch (error) {
    console.error('Freeze invoice error:', error);
    return res.status(500).json({ error: { message: 'Internal server error freezing invoice' } });
  }
}

/**
 * GET /api/invoices
 * List historical invoices
 */
export async function getInvoices(req, res) {
  try {
    const invoices = await prisma.invoiceBatch.findMany({
      include: {
        contract: {
          include: { client: { select: { companyName: true } } },
        },
        payrollBatch: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });
    return res.json(invoices);
  } catch (error) {
    console.error('Fetch invoices error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

/**
 * GET /api/invoices/:id
 * Retrieve details of a specific invoice batch and items
 */
export async function getInvoiceById(req, res) {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoiceBatch.findUnique({
      where: { id },
      include: {
        contract: {
          include: { client: true },
        },
        invoiceItems: true,
        payrollBatch: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: { message: 'Invoice not found' } });
    }

    return res.json(invoice);
  } catch (error) {
    console.error('Fetch invoice by ID error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}
