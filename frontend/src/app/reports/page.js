'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.js';
import API from '../../lib/api.js';
import {
  TrendingUp,
  Filter,
  Download,
  AlertCircle,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('payroll'); // 'payroll' | 'attendance' | 'revenue' | 'profit'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Dropdown options
  const reportTypes = [
    { id: 'payroll', name: 'Payroll Run Summary' },
    { id: 'attendance', name: 'Attendance Register Roll' },
    { id: 'revenue', name: 'Billing Revenue Statements' },
    { id: 'profit', name: 'Operational Profit/Loss performance' }
  ];

  // Fetch report preview
  const fetchReportPreview = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setReportData(null);

      let query = `?preview=true`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;

      const res = await API.get(`/reports/${reportType}${query}`);
      setReportData(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to compile report. Make sure your date filters are correct and data exists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set default dates: first day of current year to today for easy defaults
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    setStartDate(startOfYear);
    setEndDate(todayStr);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReportPreview();
    }
  }, [reportType, startDate, endDate]);

  // Export report to Excel
  const handleExportExcel = () => {
    let url = `http://localhost:5000/api/reports/${reportType}?format=excel`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    // Create an anchor tag to trigger browser download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}-report.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Title bar */}
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-2xl font-bold text-slate-800">Reports Center</h2>
          <p className="text-sm text-slate-500 mt-0.5">Generate business performance statistics, review attendance sheets, and export spreadsheets.</p>
        </div>

        {/* Global Error Callout */}
        {errorMsg && (
          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded text-amber-800 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Main layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left panel: Filter Options */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <Filter className="w-4 h-4 mr-2 text-slate-400" /> Filter Options
            </h3>
            
            {/* Report Type selector */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">Select Report Type</label>
              <div className="space-y-1">
                {reportTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setReportType(type.id)}
                    className={`w-full text-left px-3 py-2.5 rounded text-xs font-medium border transition-all ${
                      reportType === type.id
                        ? 'border-blue-500 bg-blue-50/20 text-blue-700 font-semibold'
                        : 'border-slate-100 hover:border-slate-200 text-slate-600 bg-slate-50/50'
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range pickers */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full border border-slate-200 rounded px-3 py-2 text-xs bg-slate-50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full border border-slate-200 rounded px-3 py-2 text-xs bg-slate-50 focus:outline-none"
                />
              </div>
            </div>

            {/* Excel Download button */}
            <button
              onClick={handleExportExcel}
              disabled={loading || !reportData}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel Report
            </button>
          </div>

          {/* Right panel: Preview Area */}
          <div className="lg:col-span-3 space-y-4">
            
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  Preview: {reportTypes.find(r => r.id === reportType)?.name}
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">Billed in INR</span>
              </div>

              {loading ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Compiling report calculations...
                </div>
              ) : !reportData ? (
                <p className="text-center py-12 text-slate-400 italic">Configure date filters to see preview logs.</p>
              ) : (
                <div className="space-y-4">
                  
                  {/* Summary grid values for Profitability */}
                  {reportType === 'profit' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                        <p className="text-xs font-semibold text-blue-600">Total Billed CTC Reimbursement</p>
                        <h4 className="text-lg font-black text-blue-800 mt-1">{formatCurrency(reportData.revenueBilled)}</h4>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <p className="text-xs font-semibold text-emerald-600">Net Operating profit (Service Charges)</p>
                        <h4 className="text-lg font-black text-emerald-800 mt-1">{formatCurrency(reportData.netProfit)}</h4>
                      </div>
                    </div>
                  )}

                  {/* Preview tabular logs */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      
                      {/* Headers for Payroll Report */}
                      {reportType === 'payroll' && (
                        <>
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                              <th className="p-3">Wages Period</th>
                              <th className="p-3 text-right">Gross Salaries Billed</th>
                              <th className="p-3 text-right">Employer Contributions</th>
                              <th className="p-3 text-right">Total Company Cost</th>
                              <th className="p-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {reportData.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-800">{row.period}</td>
                                <td className="p-3 text-right">Rs. {Math.round(row.totalPayrollCost).toLocaleString('en-IN')}</td>
                                <td className="p-3 text-right">Rs. {Math.round(row.totalContributions).toLocaleString('en-IN')}</td>
                                <td className="p-3 text-right font-bold text-slate-900">Rs. {Math.round(row.totalCompanyCost).toLocaleString('en-IN')}</td>
                                <td className="p-3 text-center">
                                  <span className="px-2 py-0.5 rounded-[3px] bg-emerald-50 text-emerald-700 font-bold text-[9px]">{row.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </>
                      )}

                      {/* Headers for Attendance Report */}
                      {reportType === 'attendance' && (
                        <>
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                              <th className="p-3">Employee Code</th>
                              <th className="p-3">Name</th>
                              <th className="p-3 text-center">Present Days</th>
                              <th className="p-3 text-center">Half Days</th>
                              <th className="p-3 text-center">Absent Days</th>
                              <th className="p-3 text-center">OT Hours</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {reportData.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-blue-600">{row.employeeCode}</td>
                                <td className="p-3 font-medium text-slate-900">{row.fullName}</td>
                                <td className="p-3 text-center">{row.presentDays}</td>
                                <td className="p-3 text-center">{row.halfDays}</td>
                                <td className="p-3 text-center text-red-500">{row.absentDays}</td>
                                <td className="p-3 text-center font-bold text-slate-800">{row.totalOtHours} hrs</td>
                              </tr>
                            ))}
                          </tbody>
                        </>
                      )}

                      {/* Headers for Revenue Report */}
                      {reportType === 'revenue' && (
                        <>
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                              <th className="p-3">Invoice No</th>
                              <th className="p-3">Client</th>
                              <th className="p-3">Billing Date</th>
                              <th className="p-3 text-right">Amount Billed</th>
                              <th className="p-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {reportData.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-800">{row.invoiceNumber}</td>
                                <td className="p-3 font-medium text-slate-900">{row.clientName}</td>
                                <td className="p-3">{row.invoiceDate}</td>
                                <td className="p-3 text-right font-bold text-blue-700">Rs. {Math.round(row.amount).toLocaleString('en-IN')}</td>
                                <td className="p-3 text-center">
                                  <span className="px-2 py-0.5 rounded-[3px] bg-emerald-50 text-emerald-700 font-bold text-[9px]">{row.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </>
                      )}

                      {/* Headers for Profit Report */}
                      {reportType === 'profit' && (
                        <>
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                              <th className="p-3">Financial Performance Metric</th>
                              <th className="p-3 text-right">Value (Rs)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {reportData.breakdown?.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-3 font-medium text-slate-800">{row.metric}</td>
                                <td className={`p-3 text-right font-bold ${
                                  row.metric.includes('Profit')
                                    ? row.value >= 0 ? 'text-emerald-600' : 'text-red-500'
                                    : 'text-slate-900'
                                }`}>
                                  Rs. {Math.round(row.value).toLocaleString('en-IN')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </>
                      )}

                    </table>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
