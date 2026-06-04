'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.js';
import API from '../../lib/api.js';
import { 
  FileText, 
  Download, 
  AlertCircle, 
  Calendar, 
  Filter,
  CheckCircle,
  Clock,
  Search
} from 'lucide-react';

export default function AdminPayslipsPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [payrollBatch, setPayrollBatch] = useState(null);
  const [payrollItems, setPayrollItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const monthsList = [
    { val: 1, name: 'January' },
    { val: 2, name: 'February' },
    { val: 3, name: 'March' },
    { val: 4, name: 'April' },
    { val: 5, name: 'May' },
    { val: 6, name: 'June' },
    { val: 7, name: 'July' },
    { val: 8, name: 'August' },
    { val: 9, name: 'September' },
    { val: 10, name: 'October' },
    { val: 11, name: 'November' },
    { val: 12, name: 'December' }
  ];

  const yearsList = [2024, 2025, 2026];

  const loadPayslips = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setPayrollBatch(null);
      setPayrollItems([]);

      // 1. Fetch matching payroll batches
      const historyRes = await API.get(`/payroll/history?month=${selectedMonth}&year=${selectedYear}`);
      const batch = historyRes.data?.[0];

      if (batch) {
        setPayrollBatch(batch);
        // 2. Fetch payroll batch details to retrieve individual items & generated payslips
        const detailsRes = await API.get(`/payroll/${batch.id}`);
        setPayrollItems(detailsRes.data.payrollItems || []);
      }
    } catch (err) {
      console.error('Failed to load payslips:', err);
      setErrorMsg('Failed to retrieve payslips for the selected period.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayslips();
  }, [selectedMonth, selectedYear]);

  // Filter list based on search term
  const filteredItems = payrollItems.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.employee.fullName.toLowerCase().includes(term) ||
      item.employee.employeeCode.toLowerCase().includes(term)
    );
  });

  const getPdfDownloadUrl = (relativeUrl) => {
    if (!relativeUrl) return '';
    const apiBase = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') 
      : 'http://localhost:5000';
    return `${apiBase}${relativeUrl}`;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Title Section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Employee Payslips</h2>
          <p className="text-sm text-slate-500 mt-0.5">Lookup, verify, and download PDF payslips generated for all onboarded workforce employees.</p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="month-select" className="text-xs font-bold text-slate-400 uppercase">Month</label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-slate-50 font-medium focus:outline-none"
              >
                {monthsList.map(m => (
                  <option key={m.val} value={m.val}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="year-select" className="text-xs font-bold text-slate-400 uppercase">Year</label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-slate-50 font-medium focus:outline-none"
              >
                {yearsList.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search box */}
          {payrollItems.length > 0 && (
            <div className="relative w-full md:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-800 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Payslips List Grid */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading payslips ledger...
            </div>
          ) : !payrollBatch ? (
            <div className="flex flex-col items-center justify-center p-16 text-center text-slate-400 space-y-3">
              <Calendar className="w-12 h-12 stroke-[1.5] text-slate-300" />
              <p className="text-sm font-semibold">No Payroll Record Found</p>
              <p className="text-xs max-w-xs text-slate-400">
                A payroll run must be executed for the selected period under the **Payroll** generator tab to produce payslip lists.
              </p>
            </div>
          ) : payrollItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic">
              No employees were included in this payroll batch.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                    <th className="p-4">Employee ID</th>
                    <th className="p-4">Full Name</th>
                    <th className="p-4 text-center">Payable Days</th>
                    <th className="p-4">Gross Earnings</th>
                    <th className="p-4">Total Deductions</th>
                    <th className="p-4">Net Salary</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                        No employees matched your search.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const totalDeductions = parseFloat(item.pf) + parseFloat(item.esic) + parseFloat(item.professionalTax);
                      const hasPdf = item.payslips && item.payslips.length > 0;
                      const pdfPath = hasPdf ? item.payslips[0].pdfUrl : null;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-semibold text-blue-600">{item.employee.employeeCode}</td>
                          <td className="p-4 font-medium text-slate-900">{item.employee.fullName}</td>
                          <td className="p-4 text-center font-medium">{item.payableDays}</td>
                          <td className="p-4 font-semibold">{formatCurrency(item.grossPay)}</td>
                          <td className="p-4 font-semibold text-red-500">{formatCurrency(totalDeductions)}</td>
                          <td className="p-4 font-extrabold text-blue-600">{formatCurrency(item.netSalary)}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              payrollBatch.isFrozen 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {payrollBatch.isFrozen ? 'Finalized' : 'Draft (Unfrozen)'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {payrollBatch.isFrozen && hasPdf ? (
                              <a
                                href={getPdfDownloadUrl(pdfPath)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 px-2.5 py-1 rounded transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download PDF</span>
                              </a>
                            ) : (
                              <span 
                                title="Payslips are generated only after freezing the payroll run"
                                className="text-slate-400 bg-slate-100 px-2.5 py-1 rounded cursor-not-allowed inline-flex items-center space-x-1"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Pending Freeze</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
