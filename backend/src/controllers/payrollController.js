import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { calculateEmployeePayroll } from '../services/payrollService.js';
import { generatePayslipPdf } from '../services/pdfService.js';

const prisma = new PrismaClient();

// Ensure local storage directory exists for file uploads and generated PDFs
const STORAGE_DIR = path.resolve('storage');
const PAYSLIPS_DIR = path.join(STORAGE_DIR, 'payslips');

/**
 * POST /api/payroll/generate
 * Generates monthly payroll batch calculations
 */
export async function generatePayroll(req, res) {
  const { month, year } = req.body;

  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  if (!m || !y || m < 1 || m > 12) {
    return res.status(400).json({ error: { message: 'Valid month (1-12) and year are required' } });
  }

  // Calculate days in the calendar month
  const totalDaysInMonth = new Date(y, m, 0).getDate();

  try {
    // 1. Check if payroll is already generated and frozen
    const existingBatch = await prisma.payrollBatch.findUnique({
      where: { payrollMonth_payrollYear: { payrollMonth: m, payrollYear: y } },
    });

    if (existingBatch && existingBatch.isFrozen) {
      return res.status(400).json({ error: { message: `Payroll for ${m}/${y} is already frozen and cannot be regenerated.` } });
    }

    // 2. Fetch all active employees
    const employees = await prisma.employee.findMany({
      where: { isActive: true, status: 'ACTIVE' },
      include: { bankDetails: true, designation: true },
    });

    if (employees.length === 0) {
      return res.status(400).json({ error: { message: 'No active employees found to generate payroll for.' } });
    }

    // 3. Fetch system settings for default rates and Professional Tax slabs
    const settings = await prisma.setting.findFirst();
    if (!settings) {
      return res.status(400).json({ error: { message: 'System settings are missing. Please configure settings first.' } });
    }
    const ptSlabs = JSON.parse(settings.professionalTaxSlabsJson || '[]');

    // 4. Fetch attendance records for all employees in this month
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const attendances = await prisma.attendance.findMany({
      where: {
        attendanceDate: { gte: startDate, lte: endDate },
      },
    });

    // Check if attendance is complete (at least some attendance logs must exist)
    if (attendances.length === 0) {
      return res.status(400).json({
        error: { message: `No attendance records found for the period ${m}/${y}. Please record attendance first.` },
      });
    }

    // Map attendances by employeeId
    const attendanceMap = {};
    employees.forEach((emp) => {
      attendanceMap[emp.id] = {
        presentDays: 0.0,
        halfDays: 0.0,
        absentDays: 0.0,
        overtimeHours: 0.0,
        loggedCount: 0,
      };
    });

    attendances.forEach((att) => {
      const empId = att.employeeId;
      if (!attendanceMap[empId]) return;

      attendanceMap[empId].loggedCount += 1;

      if (att.attendanceStatus === 'PRESENT') {
        attendanceMap[empId].presentDays += 1.0;
      } else if (att.attendanceStatus === 'HALF_DAY') {
        attendanceMap[empId].halfDays += 1.0;
      } else if (att.attendanceStatus === 'ABSENT') {
        attendanceMap[empId].absentDays += 1.0;
      }

      attendanceMap[empId].overtimeHours += parseFloat(att.overtimeHours) || 0.0;
    });

    // 5. Run calculations in a database transaction
    const resultBatch = await prisma.$transaction(async (tx) => {
      // If a batch exists, delete previous items to recreate them
      if (existingBatch) {
        await tx.payrollItem.deleteMany({ where: { payrollBatchId: existingBatch.id } });
        await tx.payrollBatch.delete({ where: { id: existingBatch.id } });
      }

      // Create new batch header placeholder
      const batch = await tx.payrollBatch.create({
        data: {
          payrollMonth: m,
          payrollYear: y,
          totalPayrollCost: 0.0,
          totalContributions: 0.0,
          isFrozen: false,
          createdBy: req.user.id,
        },
      });

      let totalPayrollCost = 0.0;
      let totalContributions = 0.0;
      const payrollItems = [];

      for (const emp of employees) {
        // Fetch active salary structure for employee
        const salaryStructure = await tx.salaryStructure.findFirst({
          where: { employeeId: emp.id, effectiveFrom: { lte: endDate } },
          orderBy: { effectiveFrom: 'desc' },
        });

        if (!salaryStructure) {
          throw new Error(`Salary structure not configured for employee ${emp.fullName} (${emp.employeeCode})`);
        }

        const attSummary = attendanceMap[emp.id];
        // If employee has zero attendance logs recorded, assume absent for calculations or throw error
        // As per specs: proration is based on Net Payable Days
        const presentDays = attSummary ? attSummary.presentDays : 0.0;
        const halfDays = attSummary ? attSummary.halfDays : 0.0;
        const absentDays = attSummary ? attSummary.absentDays : parseFloat(totalDaysInMonth);
        const overtimeHours = attSummary ? attSummary.overtimeHours : 0.0;

        // Perform payroll calculations
        const calc = calculateEmployeePayroll({
          fixedGross: parseFloat(salaryStructure.fixedGross),
          teaAllowance: parseFloat(salaryStructure.teaAllowance),
          fixedBasic: parseFloat(salaryStructure.fixedBasic),
          fixedHra: parseFloat(salaryStructure.fixedHra),
          fixedConveyance: parseFloat(salaryStructure.fixedConveyance),
          presentDays,
          halfDays,
          absentDays,
          overtimeHours,
          totalDaysInMonth,
          ptSlabs,
          pfRate: parseFloat(settings.defaultPfPercentage),
          pfAdminRate: parseFloat(settings.defaultPfAdminPercentage),
        });

        // Save PayrollItem record
        const item = await tx.payrollItem.create({
          data: {
            payrollBatchId: batch.id,
            employeeId: emp.id,
            totalDays: totalDaysInMonth,
            payableDays: calc.netPayableDays,
            absentDays: calc.absentDays,
            overtimeHours: overtimeHours,
            earnedBasic: calc.earnedBasic,
            earnedHra: calc.earnedHra,
            earnedConveyance: calc.earnedConveyance,
            earnedTeaAllowance: calc.earnedTeaAllowance,
            overtimeWages: calc.overtimeWages,
            specialAllowance: calc.specialAllowance,
            grossPay: calc.grossPay,
            pf: calc.pf,
            esic: calc.esic,
            professionalTax: calc.professionalTax,
            netSalary: calc.netSalary,
            employerPf: calc.employerPf,
            employerPfAdmin: calc.employerPfAdmin,
            employerEsic: calc.employerEsic,
            totalCtc: calc.totalCtc,
          },
        });

        totalPayrollCost += calc.grossPay;
        totalContributions += (calc.employerPf + calc.employerPfAdmin + calc.employerEsic);
        
        payrollItems.push({
          ...item,
          employee: { employeeCode: emp.employeeCode, fullName: emp.fullName },
        });
      }

      // Update batch header values
      const updatedBatch = await tx.payrollBatch.update({
        where: { id: batch.id },
        data: {
          totalPayrollCost,
          totalContributions,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'Payroll Generated',
          entityType: 'PayrollBatch',
          entityId: batch.id,
          description: `Generated payroll for ${payrollItems.length} employees for ${m}/${y}`,
        },
      });

      return { batch: updatedBatch, items: payrollItems };
    });

    return res.json({
      message: 'Payroll generated successfully',
      batch: resultBatch.batch,
      items: resultBatch.items,
    });
  } catch (error) {
    console.error('Payroll generation error:', error);
    return res.status(500).json({ error: { message: error.message || 'Internal server error generating payroll' } });
  }
}

/**
 * POST /api/payroll/freeze
 * Freezes the monthly payroll batch and generates PDF payslips
 */
export async function freezePayroll(req, res) {
  const { batchId } = req.body;

  if (!batchId) {
    return res.status(400).json({ error: { message: 'Payroll Batch ID is required' } });
  }

  try {
    const batch = await prisma.payrollBatch.findUnique({
      where: { id: batchId },
      include: {
        payrollItems: {
          include: {
            employee: {
              include: { bankDetails: true, designation: true },
            },
          },
        },
      },
    });

    if (!batch) {
      return res.status(404).json({ error: { message: 'Payroll batch not found' } });
    }

    if (batch.isFrozen) {
      return res.json({ message: 'Payroll batch is already frozen', batch });
    }

    const settings = await prisma.setting.findFirst();

    // 1. Create storage directories if they do not exist
    await fs.mkdir(PAYSLIPS_DIR, { recursive: true });

    // 2. Process and Freeze in a transaction
    await prisma.$transaction(async (tx) => {
      // Set batch frozen state
      await tx.payrollBatch.update({
        where: { id: batchId },
        data: { isFrozen: true, updatedBy: req.user.id },
      });

      // Generate PDF Payslips for all employees and save reference
      for (const item of batch.payrollItems) {
        const pdfBuffer = await generatePayslipPdf({
          payrollItem: {
            ...item,
            payrollBatch: { payrollMonth: batch.payrollMonth, payrollYear: batch.payrollYear }
          },
          employee: item.employee,
          designation: item.employee.designation,
          setting: settings,
        });

        // Save PDF file locally
        const fileName = `payslip-${item.id}.pdf`;
        const filePath = path.join(PAYSLIPS_DIR, fileName);
        await fs.writeFile(filePath, pdfBuffer);

        // Store relative download URL in database
        const relativeUrl = `/storage/payslips/${fileName}`;
        await tx.payslip.create({
          data: {
            payrollItemId: item.id,
            pdfUrl: relativeUrl,
          },
        });
      }

      // Log action
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'Payroll Frozen',
          entityType: 'PayrollBatch',
          entityId: batchId,
          description: `Locked payroll batch ${batch.payrollMonth}/${batch.payrollYear} and generated worker payslips`,
        },
      });
    });

    return res.json({ message: 'Payroll batch successfully frozen and payslips generated' });
  } catch (error) {
    console.error('Freeze payroll error:', error);
    return res.status(500).json({ error: { message: 'Internal server error freezing payroll' } });
  }
}

/**
 * GET /api/payroll/history
 * Fetch historical generated payroll runs
 */
export async function getPayrollHistory(req, res) {
  const { month, year } = req.query;

  const where = {};
  if (month) where.payrollMonth = parseInt(month, 10);
  if (year) where.payrollYear = parseInt(year, 10);

  try {
    const batches = await prisma.payrollBatch.findMany({
      where,
      orderBy: [{ payrollYear: 'desc' }, { payrollMonth: 'desc' }],
    });
    return res.json(batches);
  } catch (error) {
    console.error('Fetch payroll history error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

/**
 * GET /api/payroll/:id
 * Retrieve details of a specific payroll batch and items list
 */
export async function getPayrollBatchDetails(req, res) {
  const { id } = req.params;

  try {
    const batch = await prisma.payrollBatch.findUnique({
      where: { id },
      include: {
        payrollItems: {
          include: {
            employee: {
              select: {
                employeeCode: true,
                fullName: true,
                bankDetails: true,
                salaryStructures: {
                  orderBy: { effectiveFrom: 'desc' },
                  take: 1,
                },
              },
            },
            payslips: true,
          },
        },
      },
    });

    if (!batch) {
      return res.status(404).json({ error: { message: 'Payroll batch not found' } });
    }

    return res.json(batch);
  } catch (error) {
    console.error('Fetch batch details error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

/**
 * POST /api/payroll/unfreeze
 * Unfreezes a payroll batch and deletes any generated payslips/invoices
 */
export async function unfreezePayroll(req, res) {
  const { batchId } = req.body;

  if (!batchId) {
    return res.status(400).json({ error: { message: 'Batch ID is required' } });
  }

  try {
    const batch = await prisma.payrollBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return res.status(404).json({ error: { message: 'Payroll batch not found' } });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete associated invoice items and batches to avoid FK constraints
      const invoices = await tx.invoiceBatch.findMany({
        where: { payrollBatchId: batch.id },
      });

      for (const inv of invoices) {
        await tx.invoiceItem.deleteMany({ where: { invoiceBatchId: inv.id } });
        await tx.invoiceBatch.delete({ where: { id: inv.id } });
      }

      // 2. Find associated payroll items
      const items = await tx.payrollItem.findMany({
        where: { payrollBatchId: batch.id },
      });
      const itemIds = items.map((it) => it.id);

      // 3. Delete associated payslips
      if (itemIds.length > 0) {
        await tx.payslip.deleteMany({
          where: { payrollItemId: { in: itemIds } },
        });
      }

      // 4. Delete the batch and its items
      await tx.payrollItem.deleteMany({
        where: { payrollBatchId: batch.id },
      });
      await tx.payrollBatch.delete({
        where: { id: batch.id },
      });

      // 5. Log action
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'Payroll Batch Unfreeze',
          entityType: 'PayrollBatch',
          entityId: batch.id,
          description: `Admin unfroze and deleted payroll batch for month ${batch.payrollMonth}/${batch.payrollYear}`,
        },
      });
    });

    return res.json({ message: `Payroll batch for ${batch.payrollMonth}/${batch.payrollYear} unfrozen and removed from history successfully` });
  } catch (error) {
    console.error('Unfreeze payroll error:', error);
    return res.status(500).json({ error: { message: 'Internal server error unfreezing payroll batch' } });
  }
}

