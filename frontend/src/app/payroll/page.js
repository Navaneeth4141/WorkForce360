'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.js';
import API from '../../lib/api.js';
import {
  CreditCard,
  Calendar,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  Eye,
  FileText
} from 'lucide-react';

export default function PayrollPage() {
  const [activeView, setActiveView] = useState('generate'); // 'generate' | 'history'
  
  // Generator State
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [year, setYear] = useState(new Date().getFullYear());
  const [generateStep, setGenerateStep] = useState(1); // 1: Setup, 2: Preview, 3: Completed
  const [payrollBatch, setPayrollBatch] = useState(null);
  const [payrollItems, setPayrollItems] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // History State
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedBatchDetails, setSelectedBatchDetails] = useState(null);

  // Month options helper
  const monthsList = [
    { num: 1, name: 'January' }, { num: 2, name: 'February' }, { num: 3, name: 'March' },
    { num: 4, name: 'April' }, { num: 5, name: 'May' }, { num: 6, name: 'June' },
    { num: 7, name: 'July' }, { num: 8, name: 'August' }, { num: 9, name: 'September' },
    { num: 10, name: 'October' }, { num: 11, name: 'November' }, { num: 12, name: 'December' }
  ];

  // Year options helper
  const yearsList = [2024, 2025, 2026, 2027];

  // Load historical runs
  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await API.get('/payroll/history');
      setHistoryList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'history') {
      loadHistory();
      setSelectedBatchDetails(null);
    }
  }, [activeView]);

  // Request payroll batch generation (Step 2)
  const handleGeneratePreview = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await API.post('/payroll/generate', { month, year });
      setPayrollBatch(res.data.batch);
      setPayrollItems(res.data.items);
      setGenerateStep(2);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error?.message || 'Failed to generate payroll calculations. Please verify that employee attendance is logged.');
    } finally {
      setLoading(false);
    }
  };

  // Lock payroll and finalize payslips (Step 3)
  const handleFreezeBatch = async () => {
    if (!payrollBatch) return;
    if (!confirm('Are you sure you want to freeze this payroll batch? This locks all attendance, salary revisions, and logs permanently, and generates PDF payslips for employees.')) return;

    try {
      setFreezeLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      await API.post('/payroll/freeze', { batchId: payrollBatch.id });
      setSuccessMsg('Payroll batch successfully locked! Payslips are now downloadable.');
      setGenerateStep(3);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error?.message || 'Failed to freeze payroll batch.');
    } finally {
      setFreezeLoading(false);
    }
  };

  // View specific historical batch details
  const handleViewBatchDetails = async (batchId) => {
    try {
      setHistoryLoading(true);
      const res = await API.get(`/payroll/${batchId}`);
      setSelectedBatchDetails(res.data);
    } catch (err) {
      alert('Failed to load batch items');
    } finally {
      setHistoryLoading(false);
    }
  };

  const getMonthName = (num) => monthsList.find(m => m.num === num)?.name || '';
  const round = (val) => Math.round(parseFloat(val) || 0).toLocaleString('en-IN');

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Payroll Administration</h2>
            <p className="text-sm text-slate-500 mt-0.5">Calculate monthly salaries, enforce statutory deductions, and lock batches to release payslips.</p>
          </div>

          <div className="flex bg-slate-100 rounded-lg p-1 text-sm font-semibold shrink-0">
            <button
              onClick={() => { setActiveView('generate'); setGenerateStep(1); }}
              className={`px-4 py-1.5 rounded-md transition-all ${
                activeView === 'generate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Generate Run
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`px-4 py-1.5 rounded-md transition-all ${
                activeView === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Payroll History
            </button>
          </div>
        </div>

        {/* Global Alerts */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-800 text-xs font-semibold flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded text-emerald-800 text-xs font-semibold flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* VIEW 1: GENERATE PAYROLL RUN */}
        {activeView === 'generate' && (
          <div className="space-y-6">
            
            {/* Step 1: Select Month & Year */}
            {generateStep === 1 && (
              <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-full mb-3">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Setup Month and Year</h3>
                  <p className="text-xs text-slate-400 mt-1">Select the calendar period to run salary calculations for active employees.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Month</label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                      className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                    >
                      {monthsList.map((m) => (
                        <option key={m.num} value={m.num}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Year</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value, 10))}
                      className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                    >
                      {yearsList.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGeneratePreview}
                  disabled={loading}
                  className="w-full flex items-center justify-center py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>Run Calculations <ChevronRight className="w-4 h-4 ml-1" /></>
                  )}
                </button>
              </div>
            )}

            {/* Step 2: Preview Calculations Grid */}
            {generateStep === 2 && payrollBatch && (
              <div className="space-y-6">
                
                {/* Batch Cost Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">Target Period</p>
                    <h4 className="text-lg font-bold text-slate-800 mt-1">{getMonthName(payrollBatch.payrollMonth)} {payrollBatch.payrollYear}</h4>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">Gross Salaries (Rs)</p>
                    <h4 className="text-lg font-bold text-slate-800 mt-1">Rs. {round(payrollBatch.totalPayrollCost)}</h4>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm bg-blue-50/50 border-blue-100">
                    <p className="text-xs font-medium text-blue-600">Company Contributions (PF/ESIC)</p>
                    <h4 className="text-lg font-black text-blue-700 mt-1">Rs. {round(payrollBatch.totalContributions)}</h4>
                  </div>
                </div>

                {/* Items spreadsheet */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employee calculations list</h3>
                    <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Draft Status</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <th className="p-3">Employee ID</th>
                          <th className="p-3">Name</th>
                          <th className="p-3 text-center">Paid Days</th>
                          <th className="p-3 text-right">Earned Basic</th>
                          <th className="p-3 text-right">OT Wages</th>
                          <th className="p-3 text-right">Gross Pay</th>
                          <th className="p-3 text-right">PF Deduct</th>
                          <th className="p-3 text-right">ESIC Deduct</th>
                          <th className="p-3 text-right">Prof Tax</th>
                          <th className="p-3 text-right">Net Take Home</th>
                          <th className="p-3 text-right">Total CTC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {payrollItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-blue-600">{item.employee.employeeCode}</td>
                            <td className="p-3 font-medium text-slate-900">{item.employee.fullName}</td>
                            <td className="p-3 text-center">{item.payableDays}</td>
                            <td className="p-3 text-right">Rs. {round(item.earnedBasic)}</td>
                            <td className="p-3 text-right">Rs. {round(item.overtimeWages)}</td>
                            <td className="p-3 text-right font-semibold">Rs. {round(item.grossPay)}</td>
                            <td className="p-3 text-right text-red-600">Rs. {round(item.pf)}</td>
                            <td className="p-3 text-right text-red-600">Rs. {round(item.esic)}</td>
                            <td className="p-3 text-right text-red-600">Rs. {round(item.professionalTax)}</td>
                            <td className="p-3 text-right font-bold text-emerald-600">Rs. {round(item.netSalary)}</td>
                            <td className="p-3 text-right font-semibold">Rs. {round(item.totalCtc)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Confirm Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setGenerateStep(1)}
                    className="dashboard-btn-secondary"
                  >
                    Cancel / Recalculate
                  </button>
                  <button
                    onClick={handleFreezeBatch}
                    disabled={freezeLoading}
                    className="dashboard-btn-primary flex items-center"
                  >
                    {freezeLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" /> Freeze & Locked Batch
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success Completed */}
            {generateStep === 3 && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center max-w-md mx-auto space-y-6">
                <div className="flex items-center justify-center w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full mx-auto">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Payroll Run Locked</h3>
                  <p className="text-xs text-slate-500 mt-1">Salary snapshot is now permanent. Scans and payslip PDFs generated successfully for workers.</p>
                </div>
                <button
                  onClick={() => setActiveView('history')}
                  className="dashboard-btn-primary w-full"
                >
                  View Released Payslips
                </button>
              </div>
            )}

          </div>
        )}

        {/* VIEW 2: HISTORICAL PAYROLL LIST */}
        {activeView === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Batch List sidebar */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Historical Runs</h3>
              
              {historyLoading && !selectedBatchDetails && (
                <div className="text-center py-6 text-slate-400">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading history...
                </div>
              )}
              
              {!historyLoading && historyList.length === 0 && (
                <p className="text-xs text-slate-400 italic bg-white border rounded-xl p-4">No historical runs recorded.</p>
              )}

              {historyList.map((batch) => (
                <button
                  key={batch.id}
                  onClick={() => handleViewBatchDetails(batch.id)}
                  className={`w-full text-left border rounded-xl p-4 shadow-sm transition-all flex items-center justify-between ${
                    selectedBatchDetails?.id === batch.id
                      ? 'border-blue-600 bg-blue-50/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Batch {getMonthName(batch.payrollMonth)} {batch.payrollYear}</h4>
                    <p className="text-xs text-slate-500 mt-1">Cost: Rs. {round(batch.totalPayrollCost)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>

            {/* Batch Details pane */}
            <div className="lg:col-span-2">
              {selectedBatchDetails ? (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden space-y-6 p-6">
                  
                  {/* Summary */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Run Details: {getMonthName(selectedBatchDetails.payrollMonth)} {selectedBatchDetails.payrollYear}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Generated on {new Date(selectedBatchDetails.payrollGeneratedAt).toLocaleString()}</p>
                    </div>
                    <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full flex items-center">
                      <Lock className="w-3.5 h-3.5 mr-1" /> Frozen
                    </span>
                  </div>

                  {/* Table details */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <th className="p-3">Employee Code</th>
                          <th className="p-3">Name</th>
                          <th className="p-3 text-right">Gross Pay</th>
                          <th className="p-3 text-right">Deductions</th>
                          <th className="p-3 text-right">Net Take Home</th>
                          <th className="p-3 text-center">Payslip</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {selectedBatchDetails.payrollItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-blue-600">{item.employee.employeeCode}</td>
                            <td className="p-3 font-medium text-slate-900">{item.employee.fullName}</td>
                            <td className="p-3 text-right">Rs. {round(item.grossPay)}</td>
                            <td className="p-3 text-right text-red-600">Rs. {round(item.pf + item.esic + item.professionalTax)}</td>
                            <td className="p-3 text-right font-bold text-emerald-600">Rs. {round(item.netSalary)}</td>
                            <td className="p-3 text-center">
                              {item.payslips?.[0] ? (
                                <a
                                  href={`http://localhost:5000${item.payslips[0].pdfUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center text-blue-600 hover:underline font-semibold"
                                >
                                  <FileText className="w-4 h-4 mr-1" /> PDF
                                </a>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 italic">
                  Select a historical run from the sidebar to inspect items and download payslips.
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </AdminLayout>
  );
}
