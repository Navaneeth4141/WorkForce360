/**
 * Payroll Calculation Engine for WorkForce360
 * Implements the exact specs from "Payroll & Invoice Calculation Specification"
 */

/**
 * Calculates payroll components for a single employee in a given month.
 * 
 * @param {Object} params
 * @param {number} params.fixedGross - Fixed monthly gross salary
 * @param {number} params.teaAllowance - Fixed monthly tea allowance
 * @param {number} params.basicPercentage - Percentage of remaining gross for basic salary (e.g., 40)
 * @param {number} params.hraPercentage - Percentage of remaining gross for HRA (e.g., 30)
 * @param {number} params.conveyancePercentage - Percentage of remaining gross for conveyance (e.g., 30)
 * @param {number} params.presentDays - Days present (value 1.0 per day)
 * @param {number} params.halfDays - Days present half day (value 0.5 per day)
 * @param {number} params.absentDays - Days absent (value 0.0 per day)
 * @param {number} params.overtimeHours - Total overtime hours in month
 * @param {number} params.totalDaysInMonth - Total days in the calendar month (e.g. 30, 31, 28)
 * @param {Array} params.ptSlabs - List of PT slabs: [{ maxGross: 15000, pt: 0 }, { maxGross: 20000, pt: 150 }, { maxGross: 9999999, pt: 200 }]
 * @param {number} [params.pfRate=12.0] - PF percentage (default 12%)
 * @param {number} [params.pfAdminRate=1.0] - PF Admin charge percentage (default 1%)
 * @returns {Object} Calculated payroll components (all numbers with 2 decimal places precision)
 */
export function calculateEmployeePayroll({
  fixedGross,
  teaAllowance,
  basicPercentage = 40.0,
  hraPercentage = 30.0,
  conveyancePercentage = 30.0,
  presentDays,
  halfDays,
  absentDays,
  overtimeHours = 0.0,
  totalDaysInMonth,
  ptSlabs = [],
  pfRate = 12.0,
  pfAdminRate = 1.0,
}) {
  // Validate percentage rule: Basic % + HRA % + Conveyance % = 100%
  const totalPercentage = parseFloat(basicPercentage) + parseFloat(hraPercentage) + parseFloat(conveyancePercentage);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error('Salary structure percentages must sum up to exactly 100%');
  }

  // 1. Calculate Fixed Breakdown (Section 2)
  const remainingGross = fixedGross - teaAllowance;
  const fixedBasic = remainingGross * (basicPercentage / 100);
  const fixedHra = remainingGross * (hraPercentage / 100);
  const fixedConveyance = remainingGross * (conveyancePercentage / 100);

  // 2. Attendance & Net Payable Days (Section 3)
  const netPayableDays = presentDays + (halfDays * 0.5);
  const calculatedAbsentDays = totalDaysInMonth - netPayableDays;

  // 3. Earned Salary Calculations (Section 4)
  const earnedBasic = (fixedBasic * netPayableDays) / totalDaysInMonth;
  const earnedHra = (fixedHra * netPayableDays) / totalDaysInMonth;
  const earnedConveyance = (fixedConveyance * netPayableDays) / totalDaysInMonth;
  const earnedTeaAllowance = (teaAllowance * netPayableDays) / totalDaysInMonth;

  const earnedGross = earnedBasic + earnedHra + earnedConveyance + earnedTeaAllowance;

  // 4. Overtime & Special Allowance (Section 5 & 6)
  // OT Rate = ((Fixed Basic / 30) / 8) * 2
  const standardOtRate = ((fixedBasic / 30) / 8);
  const otHourlyRate = standardOtRate * 2;
  const overtimeWages = otHourlyRate * overtimeHours;

  // Special Allowance = Special Allowance Rate * Total OT Hours
  const specialAllowanceRate = standardOtRate;
  const specialAllowance = specialAllowanceRate * overtimeHours;

  // 5. Gross Pay (Section 7)
  const grossPay = earnedGross + overtimeWages + specialAllowance;

  // 6. PF Calculations (Section 8)
  const pf = earnedBasic * (pfRate / 100);
  const employerPf = earnedBasic * (pfRate / 100);
  const employerPfAdmin = earnedBasic * (pfAdminRate / 100);

  // 7. ESIC Calculations (Section 9)
  // Eligible only if Fixed Gross <= 21,000 (using fixed gross, not earned gross)
  let esic = 0.0;
  let employerEsic = 0.0;
  if (fixedGross <= 21000) {
    esic = grossPay * 0.0075; // 0.75% of Gross Pay
    employerEsic = grossPay * 0.0325; // 3.25% of Gross Pay
  }

  // 8. Professional Tax (PT) (Section 10)
  let professionalTax = 0.0;
  if (ptSlabs && ptSlabs.length > 0) {
    // Sort slabs by maxGross ascending
    const sortedSlabs = [...ptSlabs].sort((a, b) => a.maxGross - b.maxGross);
    for (const slab of sortedSlabs) {
      if (grossPay <= slab.maxGross) {
        professionalTax = slab.pt;
        break;
      }
    }
  } else {
    // Default fallback slabs
    if (grossPay <= 15000) {
      professionalTax = 0.0;
    } else if (grossPay <= 20000) {
      professionalTax = 150.0;
    } else {
      professionalTax = 200.0;
    }
  }

  // 9. Net Salary (Section 11)
  const netSalary = grossPay - pf - esic - professionalTax;

  // 10. Total CTC (Section 12)
  const totalCtc = grossPay + employerPf + employerPfAdmin + employerEsic;

  // Round helper function to two decimal places
  const toDec = (num) => parseFloat(num.toFixed(2));

  return {
    fixedBreakdown: {
      remainingGross: toDec(remainingGross),
      fixedBasic: toDec(fixedBasic),
      fixedHra: toDec(fixedHra),
      fixedConveyance: toDec(fixedConveyance),
    },
    netPayableDays: toDec(netPayableDays),
    absentDays: toDec(calculatedAbsentDays),
    earnedBasic: toDec(earnedBasic),
    earnedHra: toDec(earnedHra),
    earnedConveyance: toDec(earnedConveyance),
    earnedTeaAllowance: toDec(earnedTeaAllowance),
    earnedGross: toDec(earnedGross),
    otHourlyRate: toDec(otHourlyRate),
    overtimeWages: toDec(overtimeWages),
    specialAllowanceRate: toDec(specialAllowanceRate),
    specialAllowance: toDec(specialAllowance),
    grossPay: toDec(grossPay),
    pf: toDec(pf),
    esic: toDec(esic),
    professionalTax: toDec(professionalTax),
    netSalary: toDec(netSalary),
    employerPf: toDec(employerPf),
    employerPfAdmin: toDec(employerPfAdmin),
    employerEsic: toDec(employerEsic),
    totalCtc: toDec(totalCtc),
  };
}

/**
 * Utility to round a financial number to the nearest rupee (integer) as per Display Rules.
 * @param {number} value
 * @returns {number} Rounded integer
 */
export function roundToRupee(value) {
  return Math.round(value);
}
