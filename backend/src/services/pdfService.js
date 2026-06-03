import PDFDocument from 'pdfkit';

/**
 * Generates a PDF buffer for an employee payslip.
 * 
 * @param {Object} payrollItem - Calculated payroll item values
 * @param {Object} employee - Employee profile details
 * @param {Object} designation - Employee designation
 * @param {Object} setting - Company global settings
 * @returns {Promise<Buffer>} Promise resolving to PDF buffer
 */
export function generatePayslipPdf({ payrollItem, employee, designation, setting }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- Title and Logo Block ---
      doc.fontSize(16).bold().text(setting?.companyName || 'Elite Staffing Solutions', { align: 'center' });
      doc.fontSize(9).medium().text(setting?.address || '', { align: 'center' });
      doc.fontSize(9).text(`GST: ${setting?.gstNumber || ''} | PAN: ${setting?.panNumber || ''}`, { align: 'center' });
      doc.moveDown(1.5);

      doc.fontSize(13).bold().text('PAYSLIP FOR THE MONTH OF ' + getMonthName(payrollItem.payrollBatch.payrollMonth) + ' ' + payrollItem.payrollBatch.payrollYear, { align: 'center' });
      doc.moveDown(1);

      // --- Metadata Grid ---
      const gridTop = doc.y;
      doc.fontSize(9).bold();
      doc.text('Employee Code:', 50, gridTop);
      doc.text('Employee Name:', 50, gridTop + 15);
      doc.text('Designation:', 50, gridTop + 30);
      doc.text('Bank Name:', 50, gridTop + 45);
      doc.text('Account Number:', 50, gridTop + 60);

      doc.font('Helvetica');
      doc.text(employee.employeeCode, 150, gridTop);
      doc.text(employee.fullName, 150, gridTop + 15);
      doc.text(designation?.name || 'Worker', 150, gridTop + 30);
      doc.text(employee.bankDetails?.bankName || 'N/A', 150, gridTop + 45);
      doc.text(employee.bankDetails?.accountNumber || 'N/A', 150, gridTop + 60);

      doc.font('Helvetica-Bold');
      doc.text('Joining Date:', 330, gridTop);
      doc.text('Payable Days:', 330, gridTop + 15);
      doc.text('Absent Days:', 330, gridTop + 30);
      doc.text('Overtime Hours:', 330, gridTop + 45);
      doc.text('PF Number:', 330, gridTop + 60);

      doc.font('Helvetica');
      doc.text(new Date(employee.joiningDate).toLocaleDateString(), 430, gridTop);
      doc.text(payrollItem.payableDays.toString(), 430, gridTop + 15);
      doc.text(payrollItem.absentDays.toString(), 430, gridTop + 30);
      doc.text(payrollItem.overtimeHours.toString(), 430, gridTop + 45);
      doc.text(employee.pfNumber || 'N/A', 430, gridTop + 60);

      doc.moveDown(2);
      doc.lineWidth(1).strokeColor('#E5E7EB').moveTo(40, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      // --- Earnings & Deductions Tables ---
      const tableTop = doc.y;
      
      // Column headers
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Earnings', 50, tableTop);
      doc.text('Amount (Rs)', 220, tableTop, { align: 'right', width: 70 });
      
      doc.text('Deductions', 310, tableTop);
      doc.text('Amount (Rs)', 480, tableTop, { align: 'right', width: 70 });

      doc.moveDown(0.5);
      doc.lineWidth(0.5).strokeColor('#E5E7EB').moveTo(40, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      const itemsTop = doc.y;
      doc.font('Helvetica').fontSize(9);

      // Earnings items
      doc.text('Basic Salary:', 50, itemsTop);
      doc.text(round(payrollItem.earnedBasic), 220, itemsTop, { align: 'right', width: 70 });

      doc.text('House Rent Allowance (HRA):', 50, itemsTop + 15);
      doc.text(round(payrollItem.earnedHra), 220, itemsTop + 15, { align: 'right', width: 70 });

      doc.text('Conveyance Allowance:', 50, itemsTop + 30);
      doc.text(round(payrollItem.earnedConveyance), 220, itemsTop + 30, { align: 'right', width: 70 });

      doc.text('Tea Allowance:', 50, itemsTop + 45);
      doc.text(round(payrollItem.earnedTeaAllowance), 220, itemsTop + 45, { align: 'right', width: 70 });

      doc.text('Overtime Wages:', 50, itemsTop + 60);
      doc.text(round(payrollItem.overtimeWages), 220, itemsTop + 60, { align: 'right', width: 70 });

      doc.text('Special Allowance:', 50, itemsTop + 75);
      doc.text(round(payrollItem.specialAllowance), 220, itemsTop + 75, { align: 'right', width: 70 });

      // Deductions items
      doc.text('Provident Fund (PF):', 310, itemsTop);
      doc.text(round(payrollItem.pf), 480, itemsTop, { align: 'right', width: 70 });

      doc.text('Employee ESIC:', 310, itemsTop + 15);
      doc.text(round(payrollItem.esic), 480, itemsTop + 15, { align: 'right', width: 70 });

      doc.text('Professional Tax (PT):', 310, itemsTop + 30);
      doc.text(round(payrollItem.professionalTax), 480, itemsTop + 30, { align: 'right', width: 70 });

      doc.moveDown(7.5);
      doc.lineWidth(0.5).strokeColor('#E5E7EB').moveTo(40, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      const totalsTop = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Gross Earnings:', 50, totalsTop);
      doc.text(round(payrollItem.grossPay), 220, totalsTop, { align: 'right', width: 70 });

      doc.text('Total Deductions:', 310, totalsTop);
      doc.text(round(payrollItem.pf + payrollItem.esic + payrollItem.professionalTax), 480, totalsTop, { align: 'right', width: 70 });

      doc.moveDown(1.5);
      doc.lineWidth(1).strokeColor('#374151').moveTo(40, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      const netSalaryTop = doc.y;
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('NET TAKE HOME PAY:', 50, netSalaryTop);
      doc.text(`Rs. ${round(payrollItem.netSalary)} /-`, 350, netSalaryTop, { align: 'right', width: 200 });

      doc.moveDown(4);
      
      // Signatures
      const sigTop = doc.y;
      doc.fontSize(9).font('Helvetica');
      doc.text('Employer Signature', 50, sigTop, { underline: true });
      doc.text('Employee Signature', 380, sigTop, { underline: true });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generates a PDF buffer for a client invoice.
 */
export function generateInvoicePdf({ invoiceBatch, contract, client, setting, invoiceItems }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header company details
      doc.fontSize(16).bold().text(setting?.companyName || 'Elite Staffing Solutions', { align: 'center' });
      doc.fontSize(9).medium().text(setting?.address || '', { align: 'center' });
      doc.fontSize(9).text(`GSTIN: ${setting?.gstNumber || ''} | PAN: ${setting?.panNumber || ''}`, { align: 'center' });
      doc.moveDown(1.5);

      doc.fontSize(13).bold().text('TAX INVOICE', { align: 'center' });
      doc.moveDown(1);

      // Invoice info block
      const infoTop = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Invoice Number:', 50, infoTop);
      doc.text('Invoice Date:', 50, infoTop + 15);
      doc.text('Contract Name:', 50, infoTop + 30);

      doc.font('Helvetica');
      doc.text(invoiceBatch.invoiceNumber, 150, infoTop);
      doc.text(new Date(invoiceBatch.invoiceDate).toLocaleDateString(), 150, infoTop + 15);
      doc.text(contract.contractName, 150, infoTop + 30);

      doc.font('Helvetica-Bold');
      doc.text('Billed To:', 330, infoTop);
      doc.font('Helvetica');
      doc.text(client.companyName, 330, infoTop + 15);
      doc.text(client.address || '', 330, infoTop + 30, { width: 220 });
      doc.text(`GSTIN: ${client.gstNumber || 'N/A'}`, 330, infoTop + 55);

      doc.moveDown(3.5);
      doc.lineWidth(1).strokeColor('#E5E7EB').moveTo(40, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      // Table mapping calculations (Section 14)
      const tableTop = doc.y;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Description', 50, tableTop);
      doc.text('Base Value (Rs)', 430, tableTop, { align: 'right', width: 120 });

      doc.moveDown(0.5);
      doc.lineWidth(0.5).strokeColor('#E5E7EB').moveTo(40, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      const item = invoiceItems[0] || {};
      const rowTop = doc.y;
      doc.font('Helvetica').fontSize(9);

      doc.text('Reimbursement of Salaries (Gross Pay)', 50, rowTop);
      doc.text(round(item.payrollCost), 430, rowTop, { align: 'right', width: 120 });

      doc.text('Employer PF Contribution (12%)', 50, rowTop + 15);
      doc.text(round(item.employerPf), 430, rowTop + 15, { align: 'right', width: 120 });

      doc.text('Employer PF Admin Charges (1%)', 50, rowTop + 30);
      doc.text(round(item.employerPfAdmin), 430, rowTop + 30, { align: 'right', width: 120 });

      doc.text('Employer ESIC Contribution (3.25%)', 50, rowTop + 45);
      doc.text(round(item.employerEsic), 430, rowTop + 45, { align: 'right', width: 120 });

      doc.moveDown(4.5);
      doc.lineWidth(0.5).strokeColor('#E5E7EB').moveTo(40, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      const summaryTop = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Invoice Base (Total CTC)', 50, summaryTop);
      doc.text(round(item.payrollCost + item.employerPf + item.employerPfAdmin + item.employerEsic), 430, summaryTop, { align: 'right', width: 120 });

      doc.font('Helvetica');
      doc.text(`Service Charges @ ${contract.serviceChargePercentage}%`, 50, summaryTop + 15);
      doc.text(round(item.serviceCharge), 430, summaryTop + 15, { align: 'right', width: 120 });

      doc.font('Helvetica-Bold');
      doc.text('Taxable Amount', 50, summaryTop + 30);
      doc.text(round(item.payrollCost + item.employerPf + item.employerPfAdmin + item.employerEsic + item.serviceCharge), 430, summaryTop + 30, { align: 'right', width: 120 });

      doc.font('Helvetica');
      doc.text(`CGST @ ${contract.cgstPercentage}%`, 50, summaryTop + 45);
      doc.text(round(item.cgstAmount), 430, summaryTop + 45, { align: 'right', width: 120 });

      doc.text(`SGST @ ${contract.sgstPercentage}%`, 50, summaryTop + 60);
      doc.text(round(item.sgstAmount), 430, summaryTop + 60, { align: 'right', width: 120 });

      doc.moveDown(6.5);
      doc.lineWidth(1).strokeColor('#374151').moveTo(40, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      const finalTop = doc.y;
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('TOTAL INVOICE AMOUNT:', 50, finalTop);
      doc.text(`Rs. ${round(invoiceBatch.totalInvoiceAmount)} /-`, 350, finalTop, { align: 'right', width: 200 });

      doc.moveDown(4);
      doc.fontSize(8).font('Helvetica').text('Terms & Conditions:', 50, doc.y);
      doc.text(contract.termsConditions || 'Payment within 15 days of invoice generation.', 50, doc.y + 10, { width: 500 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Helpers
function getMonthName(monthNumber) {
  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];
  return months[monthNumber - 1] || '';
}

function round(value) {
  // Round to nearest integer (rupee) as per display rules
  return Math.round(parseFloat(value) || 0).toLocaleString('en-IN');
}
