import prisma from '../lib/prisma.js';
import { generateExcelReport } from '../services/excelService.js';

/**
 * GET /api/reports/payroll
 * Returns monthly payroll batches details, supports Excel export
 */
export async function getPayrollReport(req, res) {
  const { startDate, endDate, format } = req.query;

  const where = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  try {
    const batches = await prisma.payrollBatch.findMany({
      where,
      orderBy: [{ payrollYear: 'desc' }, { payrollMonth: 'desc' }],
    });

    // Formatting for JSON or Excel
    const formattedData = batches.map((b) => ({
      batchId: b.id,
      period: `${getMonthName(b.payrollMonth)} ${b.payrollYear}`,
      totalPayrollCost: parseFloat(b.totalPayrollCost),
      totalContributions: parseFloat(b.totalContributions),
      totalCompanyCost: parseFloat(b.totalPayrollCost) + parseFloat(b.totalContributions),
      generatedAt: new Date(b.payrollGeneratedAt).toLocaleDateString(),
      status: b.isFrozen ? 'Frozen' : 'Draft',
    }));

    if (format === 'excel') {
      const headers = [
        { header: 'Period', key: 'period', width: 20 },
        { header: 'Total Gross Wages (Rs)', key: 'totalPayrollCost', width: 25 },
        { header: 'Employer Contributions (Rs)', key: 'totalContributions', width: 28 },
        { header: 'Total CTC Cost (Rs)', key: 'totalCompanyCost', width: 25 },
        { header: 'Generation Date', key: 'generatedAt', width: 18 },
        { header: 'Status', key: 'status', width: 15 },
      ];

      const excelBuffer = await generateExcelReport({
        title: 'Payroll Summary Report',
        headers,
        rows: formattedData,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=payroll-report.xlsx');
      return res.send(excelBuffer);
    }

    return res.json(formattedData);
  } catch (error) {
    console.error('Payroll report error:', error);
    return res.status(500).json({ error: { message: 'Internal server error generating report' } });
  }
}

/**
 * GET /api/reports/attendance
 * List aggregated attendance logs per worker in a date range
 */
export async function getAttendanceReport(req, res) {
  const { startDate, endDate, format } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: { message: 'Start date and End date filters are required' } });
  }

  try {
    const records = await prisma.attendance.findMany({
      where: {
        attendanceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        employee: { select: { employeeCode: true, fullName: true } },
      },
    });

    // Aggregate by employee
    const aggregation = {};
    records.forEach((rec) => {
      const code = rec.employee.employeeCode;
      if (!aggregation[code]) {
        aggregation[code] = {
          employeeCode: code,
          fullName: rec.employee.fullName,
          presentDays: 0,
          halfDays: 0,
          absentDays: 0,
          totalOtHours: 0.0,
        };
      }

      if (rec.attendanceStatus === 'PRESENT') {
        aggregation[code].presentDays += 1;
      } else if (rec.attendanceStatus === 'HALF_DAY') {
        aggregation[code].halfDays += 1;
      } else if (rec.attendanceStatus === 'ABSENT') {
        aggregation[code].absentDays += 1;
      }

      aggregation[code].totalOtHours += parseFloat(rec.overtimeHours) || 0.0;
    });

    const reportData = Object.values(aggregation);

    if (format === 'excel') {
      const headers = [
        { header: 'Employee Code', key: 'employeeCode', width: 18 },
        { header: 'Employee Name', key: 'fullName', width: 25 },
        { header: 'Present Days (1.0)', key: 'presentDays', width: 20 },
        { header: 'Half Days (0.5)', key: 'halfDays', width: 18 },
        { header: 'Absent Days (0.0)', key: 'absentDays', width: 18 },
        { header: 'Total Overtime Hours', key: 'totalOtHours', width: 22 },
      ];

      const excelBuffer = await generateExcelReport({
        title: 'Attendance Roll Report',
        headers,
        rows: reportData,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.xlsx');
      return res.send(excelBuffer);
    }

    return res.json(reportData);
  } catch (error) {
    console.error('Attendance report error:', error);
    return res.status(500).json({ error: { message: 'Internal server error generating report' } });
  }
}

/**
 * GET /api/reports/revenue
 * Returns billing invoice revenues grouped by client/contract
 */
export async function getRevenueReport(req, res) {
  const { startDate, endDate, format } = req.query;

  const where = {};
  if (startDate || endDate) {
    where.invoiceDate = {};
    if (startDate) where.invoiceDate.gte = new Date(startDate);
    if (endDate) where.invoiceDate.lte = new Date(endDate);
  }

  try {
    const invoices = await prisma.invoiceBatch.findMany({
      where,
      include: {
        contract: {
          include: { client: { select: { companyName: true } } },
        },
      },
      orderBy: { invoiceDate: 'desc' },
    });

    const reportData = invoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.contract.client.companyName,
      contractName: inv.contract.contractName,
      invoiceDate: new Date(inv.invoiceDate).toLocaleDateString(),
      amount: parseFloat(inv.totalInvoiceAmount),
      status: inv.isFrozen ? 'Billed' : 'Draft',
    }));

    if (format === 'excel') {
      const headers = [
        { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
        { header: 'Client', key: 'clientName', width: 25 },
        { header: 'Contract Ref', key: 'contractName', width: 25 },
        { header: 'Billing Date', key: 'invoiceDate', width: 18 },
        { header: 'Final Amount Billed (Rs)', key: 'amount', width: 25 },
        { header: 'Status', key: 'status', width: 15 },
      ];

      const excelBuffer = await generateExcelReport({
        title: 'Billing Revenue Report',
        headers,
        rows: reportData,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=revenue-report.xlsx');
      return res.send(excelBuffer);
    }

    return res.json(reportData);
  } catch (error) {
    console.error('Revenue report error:', error);
    return res.status(500).json({ error: { message: 'Internal server error generating report' } });
  }
}

/**
 * GET /api/reports/profit
 * Calculates net operational profitability (Service Charges billed minus general company expenses)
 */
export async function getProfitReport(req, res) {
  const { startDate, endDate, format } = req.query;

  const invoiceWhere = { isFrozen: true };
  const expenseWhere = {};

  if (startDate || endDate) {
    invoiceWhere.invoiceDate = {};
    expenseWhere.expenseDate = {};

    if (startDate) {
      invoiceWhere.invoiceDate.gte = new Date(startDate);
      expenseWhere.expenseDate.gte = new Date(startDate);
    }
    if (endDate) {
      invoiceWhere.invoiceDate.lte = new Date(endDate);
      expenseWhere.expenseDate.lte = new Date(endDate);
    }
  }

  try {
    // 1. Fetch Service Charges from Invoice Items
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: {
        invoiceBatch: invoiceWhere,
      },
    });

    const totalServiceCharges = invoiceItems.reduce((sum, item) => sum + parseFloat(item.serviceCharge), 0.0);
    const totalPayrollReimbursement = invoiceItems.reduce((sum, item) => sum + parseFloat(item.payrollCost + item.employerPf + item.employerPfAdmin + item.employerEsic), 0.0);

    // 2. Fetch manual general expenses (e.g. transportation, administrative)
    const expenses = await prisma.expense.findMany({
      where: expenseWhere,
    });

    const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0.0);

    // 3. Profit calculations
    // Net profit = service charges earned - expenses paid
    const netProfit = totalServiceCharges - totalExpenses;

    const reportSummary = [
      { metric: 'Wages Reimbursements billed to Clients', value: totalPayrollReimbursement },
      { metric: 'Agency Service Fees earned (Gross Revenue)', value: totalServiceCharges },
      { metric: 'Operating Expenses paid (manual logs)', value: totalExpenses },
      { metric: 'Net Operating Profit / Loss', value: netProfit },
    ];

    if (format === 'excel') {
      const headers = [
        { header: 'Financial KPI Metric', key: 'metric', width: 45 },
        { header: 'Value (Rs)', key: 'value', width: 25 },
      ];

      const excelBuffer = await generateExcelReport({
        title: 'Profitability Performance Summary',
        headers,
        rows: reportSummary,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=profit-report.xlsx');
      return res.send(excelBuffer);
    }

    return res.json({
      revenueBilled: totalPayrollReimbursement + totalServiceCharges,
      serviceChargesEarned: totalServiceCharges,
      generalExpenses: totalExpenses,
      netProfit,
      breakdown: reportSummary,
    });
  } catch (error) {
    console.error('Profit report error:', error);
    return res.status(500).json({ error: { message: 'Internal server error generating report' } });
  }
}

// Helper Month names mapping
function getMonthName(monthNumber) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1] || '';
}
