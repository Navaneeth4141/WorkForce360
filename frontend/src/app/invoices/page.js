'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.js';
import API from '../../lib/api.js';
import {
  FileSignature,
  Briefcase,
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

export default function InvoicesPage() {
  const [activeView, setActiveView] = useState('generate'); // 'generate' | 'history'
  
  // Data lists
  const [contracts, setContracts] = useState([]);
  const [payrollBatches, setPayrollBatches] = useState([]);
  
  // Generator State
  const [selectedContractId, setSelectedContractId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [generateStep, setGenerateStep] = useState(1); // 1: Setup, 2: Preview, 3: Completed
  const [invoiceBatch, setInvoiceBatch] = useState(null);
  const [invoiceItem, setInvoiceItem] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // History State
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState(null);

  // Month names helper
  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Load contracts and payroll batches for setup selection
  const loadSetupOptions = async () => {
    try {
      const contractRes = await API.get('/contracts');
      setContracts(contractRes.data.filter(c => c.status === 'ACTIVE'));
      if (contractRes.data.length > 0) {
        setSelectedContractId(contractRes.data[0].id);
      }

      const payrollRes = await API.get('/payroll/history');
      setPayrollBatches(payrollRes.data);
      if (payrollRes.data.length > 0) {
        setSelectedBatchId(payrollRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load historical invoices
  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await API.get('/invoices');
      setHistoryList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadSetupOptions();
  }, []);

  useEffect(() => {
    if (activeView === 'history') {
      loadHistory();
      setSelectedInvoiceDetails(null);
    }
  }, [activeView]);

  // Request invoice preview generation (Step 2)
  const handleGeneratePreview = async () => {
    if (!selectedContractId || !selectedBatchId) {
      setErrorMsg('Please select both a contract and a payroll batch.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await API.post('/invoices/generate', {
        contractId: selectedContractId,
        payrollBatchId: selectedBatchId
      });
      setInvoiceBatch(res.data.invoice);
      setInvoiceItem(res.data.item);
      setGenerateStep(2);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error?.message || 'Failed to generate invoice preview. Make sure payroll is generated for this month first.');
    } finally {
      setLoading(false);
    }
  };

  // Lock invoice and generate PDF (Step 3)
  const handleFreezeInvoice = async () => {
    if (!invoiceBatch) return;
    if (!confirm('Are you sure you want to freeze and finalize this client invoice? This locks the billing information permanently and generates the PDF invoice.')) return;

    try {
      setFreezeLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      await API.post('/invoices/freeze', { invoiceId: invoiceBatch.id });
      setSuccessMsg('Invoice successfully frozen! PDF invoice is now downloadable.');
      setGenerateStep(3);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error?.message || 'Failed to freeze invoice.');
    } finally {
      setFreezeLoading(false);
    }
  };

  // View specific historical invoice details
  const handleViewInvoiceDetails = async (invoiceId) => {
    try {
      setHistoryLoading(true);
      const res = await API.get(`/invoices/${invoiceId}`);
      setSelectedInvoiceDetails(res.data);
    } catch (err) {
      alert('Failed to load invoice items');
    } finally {
      setHistoryLoading(false);
    }
  };

  const getMonthName = (num) => monthsList[num - 1] || '';
  const round = (val) => Math.round(parseFloat(val) || 0).toLocaleString('en-IN');

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Client Invoices</h2>
            <p className="text-sm text-slate-500 mt-0.5">Generate contract-based monthly tax invoices mapping total company costs, service markups, and GST.</p>
          </div>

          <div className="flex bg-slate-100 rounded-lg p-1 text-sm font-semibold shrink-0">
            <button
              onClick={() => { setActiveView('generate'); setGenerateStep(1); }}
              className={`px-4 py-1.5 rounded-md transition-all ${
                activeView === 'generate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Generate Bill
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`px-4 py-1.5 rounded-md transition-all ${
                activeView === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Billing History
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

        {/* VIEW 1: GENERATE CLIENT BILL */}
        {activeView === 'generate' && (
          <div className="space-y-6">
            
            {/* Step 1: Select Contract & Run month */}
            {generateStep === 1 && (
              <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-full mb-3">
                    <FileSignature className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Setup Invoice Billing</h3>
                  <p className="text-xs text-slate-400 mt-1">Select a client contract and a corresponding monthly payroll batch to calculate billing reimbursements.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Contract Name / Client</label>
                    <select
                      value={selectedContractId}
                      onChange={(e) => setSelectedContractId(e.target.value)}
                      className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                    >
                      {contracts.map((con) => (
                        <option key={con.id} value={con.id}>{con.contractName} ({con.client.companyName})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Payroll Period Batch</label>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                    >
                      {payrollBatches.map((b) => (
                        <option key={b.id} value={b.id}>Run of {getMonthName(b.payrollMonth)} {b.payrollYear} (Cost: Rs. {round(b.totalPayrollCost)})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGeneratePreview}
                  disabled={loading || contracts.length === 0 || payrollBatches.length === 0}
                  className="w-full flex items-center justify-center py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>Generate Invoice Preview <ChevronRight className="w-4 h-4 ml-1" /></>
                  )}
                </button>
              </div>
            )}

            {/* Step 2: Side-by-side calculations preview */}
            {generateStep === 2 && invoiceBatch && invoiceItem && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Details Summary Info card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Billing Reference</h3>
                  <div className="text-xs space-y-2 text-slate-600">
                    <div className="flex justify-between"><span>Draft Invoice Number:</span><span className="font-semibold text-slate-800">{invoiceBatch.invoiceNumber}</span></div>
                    <div className="flex justify-between"><span>Billing Date:</span><span>{new Date(invoiceBatch.invoiceDate).toLocaleDateString()}</span></div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 pt-2">Salary costs breakup</h3>
                  <div className="text-xs space-y-2 text-slate-600">
                    <div className="flex justify-between"><span>Gross Salaries (Wages):</span><span className="font-medium text-slate-800">Rs. {round(invoiceItem.payrollCost)}</span></div>
                    <div className="flex justify-between"><span>Employer PF (12%):</span><span>Rs. {round(invoiceItem.employerPf)}</span></div>
                    <div className="flex justify-between"><span>Employer PF Admin Charges (1%):</span><span>Rs. {round(invoiceItem.employerPfAdmin)}</span></div>
                    <div className="flex justify-between"><span>Employer ESIC (3.25%):</span><span>Rs. {round(invoiceItem.employerEsic)}</span></div>
                  </div>
                </div>

                {/* Final Tax Invoice calculations box */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md text-white flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tax Invoice Summary</span>
                      <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded">Preview Draft</span>
                    </div>

                    <div className="space-y-2 text-sm text-slate-300">
                      <div className="flex justify-between">
                        <span>Invoice Base (Total CTC):</span>
                        <span className="font-bold text-white">Rs. {round(invoiceItem.payrollCost + invoiceItem.employerPf + invoiceItem.employerPfAdmin + invoiceItem.employerEsic)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Charges Markup:</span>
                        <span>Rs. {round(invoiceItem.serviceCharge)}</span>
                      </div>
                      
                      <div className="w-full h-px bg-slate-800 my-2"></div>
                      
                      <div className="flex justify-between font-bold text-white">
                        <span>Taxable Amount:</span>
                        <span>Rs. {round(invoiceItem.payrollCost + invoiceItem.employerPf + invoiceItem.employerPfAdmin + invoiceItem.employerEsic + invoiceItem.serviceCharge)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>CGST Tax:</span>
                        <span>Rs. {round(invoiceItem.cgstAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST Tax:</span>
                        <span>Rs. {round(invoiceItem.sgstAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-4 mt-6">
                    <div className="flex justify-between items-baseline mb-6">
                      <span className="text-sm font-bold text-slate-400">FINAL BILL AMOUNT:</span>
                      <span className="text-2xl font-black text-emerald-400">Rs. {round(invoiceBatch.totalInvoiceAmount)} /-</span>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => setGenerateStep(1)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleFreezeInvoice}
                        disabled={freezeLoading}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-colors"
                      >
                        {freezeLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                        ) : (
                          'Freeze & Generate Invoice'
                        )}
                      </button>
                    </div>
                  </div>
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
                  <h3 className="text-lg font-bold text-slate-800">Invoice finalized</h3>
                  <p className="text-xs text-slate-500 mt-1">Invoice locked permanently. PDF billing file generated successfully.</p>
                </div>
                <button
                  onClick={() => setActiveView('history')}
                  className="dashboard-btn-primary w-full"
                >
                  View Billed Invoices
                </button>
              </div>
            )}

          </div>
        )}

        {/* VIEW 2: HISTORICAL INVOICES HISTORY */}
        {activeView === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sidebar Invoice List */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Billing Ledger</h3>
              
              {historyLoading && !selectedInvoiceDetails && (
                <div className="text-center py-6 text-slate-400">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading history...
                </div>
              )}
              
              {!historyLoading && historyList.length === 0 && (
                <p className="text-xs text-slate-400 italic bg-white border rounded-xl p-4">No invoices billed yet.</p>
              )}

              {historyList.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => handleViewInvoiceDetails(inv.id)}
                  className={`w-full text-left border rounded-xl p-4 shadow-sm transition-all flex items-center justify-between ${
                    selectedInvoiceDetails?.id === inv.id
                      ? 'border-blue-600 bg-blue-50/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{inv.invoiceNumber}</h4>
                    <p className="text-xs text-slate-500 mt-1">{inv.contract.client.companyName}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Amt: Rs. {round(inv.totalInvoiceAmount)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>

            {/* Details Pane */}
            <div className="lg:col-span-2">
              {selectedInvoiceDetails ? (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden space-y-6 p-6">
                  
                  {/* Summary */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">{selectedInvoiceDetails.invoiceNumber}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Billed to {selectedInvoiceDetails.contract.client.companyName} on {new Date(selectedInvoiceDetails.invoiceDate).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full flex items-center">
                        <Lock className="w-3.5 h-3.5 mr-1" /> Finalized
                      </span>
                      {selectedInvoiceDetails.pdfUrl ? (
                        <a
                          href={`http://localhost:5000${selectedInvoiceDetails.pdfUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" /> PDF Invoice
                        </a>
                      ) : null}
                    </div>
                  </div>

                  {/* Calculations breakdown details */}
                  {selectedInvoiceDetails.invoiceItems?.[0] && (
                    <div className="text-xs space-y-4">
                      <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-100">
                        <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Calculation details</h4>
                        <div className="flex justify-between"><span>Salary costs:</span><span>Rs. {round(selectedInvoiceDetails.invoiceItems[0].payrollCost)}</span></div>
                        <div className="flex justify-between"><span>Employer PF contributions:</span><span>Rs. {round(selectedInvoiceDetails.invoiceItems[0].employerPf)}</span></div>
                        <div className="flex justify-between"><span>Employer PF Admin:</span><span>Rs. {round(selectedInvoiceDetails.invoiceItems[0].employerPfAdmin)}</span></div>
                        <div className="flex justify-between"><span>Employer ESIC:</span><span>Rs. {round(selectedInvoiceDetails.invoiceItems[0].employerEsic)}</span></div>
                        
                        <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-800">
                          <span>Invoice Base (Total Company Cost):</span>
                          <span>Rs. {round(selectedInvoiceDetails.invoiceItems[0].payrollCost + selectedInvoiceDetails.invoiceItems[0].employerPf + selectedInvoiceDetails.invoiceItems[0].employerPfAdmin + selectedInvoiceDetails.invoiceItems[0].employerEsic)}</span>
                        </div>
                      </div>

                      <div className="bg-slate-900 text-white rounded-lg p-4 space-y-2">
                        <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">Taxable Invoice & Total</h4>
                        <div className="flex justify-between"><span>Service Charges Markup:</span><span>Rs. {round(selectedInvoiceDetails.invoiceItems[0].serviceCharge)}</span></div>
                        <div className="flex justify-between font-semibold"><span>Taxable Amount:</span><span>Rs. {round(selectedInvoiceDetails.invoiceItems[0].payrollCost + selectedInvoiceDetails.invoiceItems[0].employerPf + selectedInvoiceDetails.invoiceItems[0].employerPfAdmin + selectedInvoiceDetails.invoiceItems[0].employerEsic + selectedInvoiceDetails.invoiceItems[0].serviceCharge)}</span></div>
                        <div className="flex justify-between text-slate-400"><span>CGST:</span><span>Rs. {round(selectedInvoiceDetails.invoiceItems[0].cgstAmount)}</span></div>
                        <div className="flex justify-between text-slate-400"><span>SGST:</span><span>Rs. {round(selectedInvoiceDetails.invoiceItems[0].sgstAmount)}</span></div>
                        
                        <div className="border-t border-slate-800 pt-2 flex justify-between font-black text-emerald-400 text-sm">
                          <span>TOTAL INVOICED:</span>
                          <span>Rs. {round(selectedInvoiceDetails.totalInvoiceAmount)} /-</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 italic">
                  Select a historical bill from the ledger sidebar to inspect items and download PDF.
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </AdminLayout>
  );
}
