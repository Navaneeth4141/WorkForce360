'use client';

import React, { useState, useEffect } from 'react';
import API from '../../../lib/api.js';
import { 
  FileText, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  CreditCard,
  Calendar,
  AlertCircle,
  Clock,
  Briefcase
} from 'lucide-react';

export default function WorkerPayslips() {
  const [payrollItems, setPayrollItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);

  useEffect(() => {
    async function fetchPayroll() {
      try {
        setLoading(true);
        const res = await API.get('/employees/payroll/me');
        setPayrollItems(res.data);
      } catch (err) {
        console.error('Error fetching payroll items:', err);
        setError('Failed to fetch historical payslips. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchPayroll();
  }, []);

  const toggleExpand = (itemId) => {
    if (expandedItem === itemId) {
      setExpandedItem(null);
    } else {
      setExpandedItem(itemId);
    }
  };

  const getMonthName = (monthNum) => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  const getPdfDownloadUrl = (relativeUrl) => {
    if (!relativeUrl) return '';
    const apiBase = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') 
      : 'http://localhost:5000';
    return `${apiBase}${relativeUrl}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500">Loading payroll history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Salary Ledger & Payslips</h1>
        <p className="text-sm text-slate-500">Access your historical payslip documents, salary breakdowns, and statutory deductions.</p>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-50 text-red-700 p-4 border border-red-200 rounded-xl text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {payrollItems.length > 0 ? (
        <div className="space-y-4">
          {payrollItems.map((item) => {
            const isExpanded = expandedItem === item.id;
            const monthName = getMonthName(item.payrollBatch.payrollMonth);
            const yearVal = item.payrollBatch.payrollYear;
            const hasPayslipPdf = item.payslips && item.payslips.length > 0;
            const payslipPdf = hasPayslipPdf ? item.payslips[0] : null;

            // Calculations
            const gross = parseFloat(item.grossPay);
            const pf = parseFloat(item.pf);
            const esic = parseFloat(item.esic);
            const pt = parseFloat(item.professionalTax);
            const totalDeductions = pf + esic + pt;
            const net = parseFloat(item.netSalary);

            const employerPf = parseFloat(item.employerPf);
            const employerPfAdmin = parseFloat(item.employerPfAdmin);
            const employerEsic = parseFloat(item.employerEsic);
            const totalEmployerContributions = employerPf + employerPfAdmin + employerEsic;
            const totalCtc = parseFloat(item.totalCtc);

            return (
              <div 
                key={item.id} 
                className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300"
              >
                {/* Summary Header Row */}
                <div 
                  onClick={() => toggleExpand(item.id)}
                  className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base md:text-lg">
                        {monthName} {yearVal}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        Payable Days: {item.payableDays} | OT Hours: {item.overtimeHours} hrs
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Net Take-Home</span>
                      <p className="text-lg font-extrabold text-blue-600">
                        ₹{net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      {hasPayslipPdf ? (
                        <a
                          href={getPdfDownloadUrl(payslipPdf.pdfUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()} // Stop row toggle when downloading
                          className="flex items-center space-x-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
                        >
                          <Download className="w-4 h-4 shrink-0" />
                          <span>PDF Payslip</span>
                        </a>
                      ) : (
                        <span className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200 font-semibold">
                          PDF Generating...
                        </span>
                      )}

                      <button className="text-slate-400 hover:text-slate-600 p-1">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Details Panel */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Earnings Breakdown */}
                      <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                          <CreditCard className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-bold text-slate-800 text-sm">Earnings Component</h4>
                        </div>
                        <div className="space-y-2.5 text-xs text-slate-600">
                          <div className="flex justify-between">
                            <span>Earned Basic Salary</span>
                            <span className="font-semibold text-slate-800">₹{parseFloat(item.earnedBasic).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>House Rent Allowance (HRA)</span>
                            <span className="font-semibold text-slate-800">₹{parseFloat(item.earnedHra).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Conveyance Allowance</span>
                            <span className="font-semibold text-slate-800">₹{parseFloat(item.earnedConveyance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tea & Snacks Allowance</span>
                            <span className="font-semibold text-slate-800">₹{parseFloat(item.earnedTeaAllowance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between text-blue-600 font-semibold bg-blue-50/50 p-1.5 rounded-lg -mx-1.5">
                            <span>Overtime Wages ({item.overtimeHours} hrs)</span>
                            <span>₹{parseFloat(item.overtimeWages).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Special Allowance (Premium)</span>
                            <span className="font-semibold text-slate-800">₹{parseFloat(item.specialAllowance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="border-t border-slate-100 pt-2.5 flex justify-between font-bold text-slate-800 text-sm">
                            <span>Gross Pay</span>
                            <span className="text-slate-900">₹{gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions Breakdown */}
                      <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                          <FileText className="w-4 h-4 text-red-500" />
                          <h4 className="font-bold text-slate-800 text-sm">Deductions (Statutory)</h4>
                        </div>
                        <div className="space-y-2.5 text-xs text-slate-600">
                          <div className="flex justify-between">
                            <span>Provident Fund (PF) Employee Share</span>
                            <span className="font-semibold text-slate-800">₹{pf.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ESIC Employee Share</span>
                            <span className="font-semibold text-slate-800">₹{esic.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Professional Tax (PT)</span>
                            <span className="font-semibold text-slate-800">₹{pt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="border-t border-slate-100 pt-2.5 flex justify-between font-bold text-red-600 text-sm">
                            <span>Total Deductions</span>
                            <span>₹{totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>

                      {/* CTC Summary */}
                      <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                          <h4 className="font-bold text-slate-800 text-sm">Company Cost (CTC)</h4>
                        </div>
                        <div className="space-y-2.5 text-xs text-slate-600">
                          <div className="flex justify-between">
                            <span>Employer PF Contribution</span>
                            <span className="font-semibold text-slate-800">₹{employerPf.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Employer PF Admin Charges</span>
                            <span className="font-semibold text-slate-800">₹{employerPfAdmin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Employer ESIC Contribution</span>
                            <span className="font-semibold text-slate-800">₹{employerEsic.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gross Pay Component</span>
                            <span className="font-semibold text-slate-800">₹{gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="border-t border-slate-100 pt-2.5 flex justify-between font-bold text-slate-800 text-sm">
                            <span>Total CTC (Monthly Cost)</span>
                            <span className="text-blue-600 font-extrabold">₹{totalCtc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Net take home splash banner */}
                    <div className="bg-blue-600 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h5 className="font-bold text-sm">Take Home Summary</h5>
                        <p className="text-xs text-blue-100 font-light mt-0.5">Net take-home salary is computed as Gross Pay minus employee statutory deductions.</p>
                      </div>
                      <div className="bg-white/10 px-4 py-2 rounded-xl text-right">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Net Take-Home Pay</span>
                        <p className="text-xl font-black">₹{net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
          <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-4">
            <FileText className="w-16 h-16 stroke-[1.25] text-slate-300" />
            <h2 className="text-lg font-bold text-slate-800">No payslips found on record.</h2>
            <p className="text-sm text-slate-400 font-light">
              Your historical salary ledger will build here as payroll runs are generated and finalized by the agency admin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
