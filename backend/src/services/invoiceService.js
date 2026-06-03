/**
 * Invoice Calculation Engine for WorkForce360
 * Implements the exact specs from "Payroll & Invoice Calculation Specification" (Section 14)
 */

/**
 * Calculates client invoice parameters for a contract run.
 * 
 * @param {Object} params
 * @param {Array} params.employeePayrollItems - Array of payroll items for employees assigned to this contract.
 *                                              Each item should have: grossPay, employerPf, employerPfAdmin, employerEsic
 * @param {number} params.serviceChargePercentage - Service charge % from Contract (e.g. 10.0)
 * @param {number} params.cgstPercentage - CGST % from Contract (e.g. 9.0)
 * @param {number} params.sgstPercentage - SGST % from Contract (e.g. 9.0)
 * @returns {Object} Calculated invoice breakdown (all numbers with 2 decimal places precision)
 */
export function calculateContractInvoice({
  employeePayrollItems = [],
  serviceChargePercentage,
  cgstPercentage,
  sgstPercentage,
}) {
  let aggregatePayrollCost = 0.0;
  let aggregateEmployerPf = 0.0;
  let aggregateEmployerPfAdmin = 0.0;
  let aggregateEmployerEsic = 0.0;
  let invoiceBase = 0.0; // sum of Total CTCs

  // 1. Calculate aggregate employee cost items (Section 14: Employee Scope & Invoice Base)
  employeePayrollItems.forEach((item) => {
    const grossPay = parseFloat(item.grossPay) || 0.0;
    const employerPf = parseFloat(item.employerPf) || 0.0;
    const employerPfAdmin = parseFloat(item.employerPfAdmin) || 0.0;
    const employerEsic = parseFloat(item.employerEsic) || 0.0;

    aggregatePayrollCost += grossPay;
    aggregateEmployerPf += employerPf;
    aggregateEmployerPfAdmin += employerPfAdmin;
    aggregateEmployerEsic += employerEsic;

    // CTC = grossPay + employerPf + employerPfAdmin + employerEsic
    invoiceBase += (grossPay + employerPf + employerPfAdmin + employerEsic);
  });

  // 2. Service Charge (Section 14)
  // Service Charge = Invoice Base * Service Charge %
  const serviceCharge = invoiceBase * (serviceChargePercentage / 100);

  // 3. Taxable Amount (Section 14)
  // Taxable Amount = Invoice Base + Service Charge
  const taxableAmount = invoiceBase + serviceCharge;

  // 4. GST Taxes (Section 14)
  const cgstAmount = taxableAmount * (cgstPercentage / 100);
  const sgstAmount = taxableAmount * (sgstPercentage / 100);

  // 5. Final Invoice Amount (Section 14)
  const totalAmount = taxableAmount + cgstAmount + sgstAmount;

  // Round helper function to two decimal places
  const toDec = (num) => parseFloat(num.toFixed(2));

  return {
    employeeCount: employeePayrollItems.length,
    payrollCost: toDec(aggregatePayrollCost),
    employerPf: toDec(aggregateEmployerPf),
    employerPfAdmin: toDec(aggregateEmployerPfAdmin),
    employerEsic: toDec(aggregateEmployerEsic),
    invoiceBase: toDec(invoiceBase),
    serviceCharge: toDec(serviceCharge),
    taxableAmount: toDec(taxableAmount),
    cgstAmount: toDec(cgstAmount),
    sgstAmount: toDec(sgstAmount),
    totalAmount: toDec(totalAmount),
  };
}
