'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.js';
import API from '../../lib/api.js';
import { Briefcase, FileSignature, Plus, Trash2, X, AlertCircle, CheckCircle } from 'lucide-react';

export default function ClientsPage() {
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' | 'contracts'
  const [clients, setClients] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Add Client Modal State
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState({
    companyName: '', gstNumber: '', panNumber: '', address: '', contactPerson: '', phoneNumber: '', email: ''
  });

  // Create Contract Modal State
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [contractForm, setContractForm] = useState({
    clientId: '', contractName: '', startDate: '', endDate: '',
    serviceChargePercentage: '10.0', cgstPercentage: '9.0', sgstPercentage: '9.0',
    termsConditions: '', status: 'DRAFT'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const clientRes = await API.get('/clients');
      setClients(clientRes.data);

      const contractRes = await API.get('/contracts');
      setContracts(contractRes.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load clients or contracts database logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Add Client Submit
  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      await API.post('/clients', clientForm);
      setMessage(`Client ${clientForm.companyName} registered successfully`);
      setClientModalOpen(false);
      setClientForm({ companyName: '', gstNumber: '', panNumber: '', address: '', contactPerson: '', phoneNumber: '', email: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create client');
    }
  };

  // Handle Create Contract Submit
  const handleCreateContract = async (e) => {
    e.preventDefault();
    try {
      await API.post('/contracts', contractForm);
      setMessage(`Contract ${contractForm.contractName} created successfully`);
      setContractModalOpen(false);
      setContractForm({
        clientId: '', contractName: '', startDate: '', endDate: '',
        serviceChargePercentage: '10.0', cgstPercentage: '9.0', sgstPercentage: '9.0',
        termsConditions: '', status: 'DRAFT'
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create contract');
    }
  };

  // Handle Deactivate Client
  const handleDeactivateClient = async (id, name) => {
    if (!confirm(`Are you sure you want to deactivate ${name}? This terminates all ongoing contracts associated with this client.`)) return;
    try {
      await API.delete(`/clients/${id}`);
      setMessage(`Client ${name} deactivated successfully`);
      loadData();
    } catch (err) {
      alert('Failed to deactivate client');
    }
  };

  // Handle Update Contract Status
  const handleUpdateContractStatus = async (id, newStatus) => {
    try {
      await API.put(`/contracts/${id}/status`, { status: newStatus });
      setMessage('Contract status updated successfully');
      loadData();
    } catch (err) {
      alert('Failed to update contract status');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Title bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Clients & Contracts</h2>
            <p className="text-sm text-slate-500 mt-0.5">Manage corporate customer profiles, billable contract service rates, and GST tax codes.</p>
          </div>

          <div className="flex bg-slate-100 rounded-lg p-1 text-sm font-semibold shrink-0">
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-1.5 rounded-md transition-all ${
                activeTab === 'clients' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Clients List
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-4 py-1.5 rounded-md transition-all ${
                activeTab === 'contracts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Contracts Directory
            </button>
          </div>
        </div>

        {/* Alerts */}
        {message && (
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded text-emerald-800 text-xs font-semibold flex justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-emerald-550 hover:text-emerald-700">✕</button>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded text-amber-800 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* TAB 1: CLIENTS */}
        {activeTab === 'clients' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Corporations</h3>
              <button
                onClick={() => setClientModalOpen(true)}
                className="dashboard-btn-primary text-xs py-1.5 flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Client Profile
              </button>
            </div>

            {/* Clients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-2 text-center py-6 text-slate-400">Loading...</div>
              ) : clients.length === 0 ? (
                <div className="col-span-2 text-center py-6 text-slate-400 italic bg-white border border-slate-200 rounded-xl">No clients found.</div>
              ) : (
                clients.map((c) => (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 relative">
                    <button
                      onClick={() => handleDeactivateClient(c.id, c.companyName)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                      title="Deactivate Client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 rounded-xl font-black">
                        {c.companyName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{c.companyName}</h4>
                        <p className="text-xs text-slate-400">GST: {c.gstNumber || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="text-xs space-y-1.5 text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex justify-between"><span>Contact Person:</span><span className="font-medium text-slate-800">{c.contactPerson || 'N/A'}</span></div>
                      <div className="flex justify-between"><span>Phone / Email:</span><span>{c.phoneNumber || 'N/A'} / {c.email || 'N/A'}</span></div>
                      <div className="flex justify-between"><span>Address:</span><span className="truncate max-w-[200px]">{c.address || 'N/A'}</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CONTRACTS */}
        {activeTab === 'contracts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service contracts</h3>
              <button
                onClick={() => {
                  if (clients.length === 0) {
                    alert('Please register at least one client first before creating a contract.');
                    return;
                  }
                  setContractForm(prev => ({ ...prev, clientId: clients[0].id }));
                  setContractModalOpen(true);
                }}
                className="dashboard-btn-primary text-xs py-1.5 flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Create Service Contract
              </button>
            </div>

            {/* Contracts table list */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-4">Contract Name</th>
                      <th className="p-4">Client Name</th>
                      <th className="p-4">Validity Period</th>
                      <th className="p-4 text-center">Service Charge %</th>
                      <th className="p-4 text-center">CGST / SGST</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {loading ? (
                      <tr><td colSpan={7} className="p-6 text-center text-slate-400">Loading...</td></tr>
                    ) : contracts.length === 0 ? (
                      <tr><td colSpan={7} className="p-6 text-center text-slate-400 italic">No contracts found.</td></tr>
                    ) : (
                      contracts.map((con) => (
                        <tr key={con.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-semibold text-slate-800">{con.contractName}</td>
                          <td className="p-4 font-medium text-slate-900">{con.client.companyName}</td>
                          <td className="p-4">{new Date(con.startDate).toLocaleDateString()} - {new Date(con.endDate).toLocaleDateString()}</td>
                          <td className="p-4 text-center font-bold text-blue-600">{con.serviceChargePercentage}%</td>
                          <td className="p-4 text-center">{con.cgstPercentage}% / {con.sgstPercentage}%</td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              con.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : con.status === 'DRAFT'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {con.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {con.status === 'DRAFT' ? (
                              <button
                                onClick={() => handleUpdateContractStatus(con.id, 'ACTIVE')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                              >
                                Activate
                              </button>
                            ) : con.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleUpdateContractStatus(con.id, 'TERMINATED')}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold"
                              >
                                Terminate
                              </button>
                            ) : (
                              <span className="text-slate-400 font-medium">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Client Profile */}
        {clientModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
            <form onSubmit={handleAddClient} className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
                <h3 className="text-base font-bold flex items-center"><Briefcase className="w-5 h-5 mr-2" /> Add Client Profile</h3>
                <button type="button" onClick={() => setClientModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={clientForm.companyName}
                    onChange={(e) => setClientForm({ ...clientForm, companyName: e.target.value })}
                    className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      value={clientForm.gstNumber}
                      onChange={(e) => setClientForm({ ...clientForm, gstNumber: e.target.value })}
                      className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">PAN Card Number</label>
                    <input
                      type="text"
                      value={clientForm.panNumber}
                      onChange={(e) => setClientForm({ ...clientForm, panNumber: e.target.value })}
                      className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={clientForm.contactPerson}
                      onChange={(e) => setClientForm({ ...clientForm, contactPerson: e.target.value })}
                      className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={clientForm.phoneNumber}
                      onChange={(e) => setClientForm({ ...clientForm, phoneNumber: e.target.value })}
                      className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Registered Address</label>
                  <textarea
                    rows={2}
                    value={clientForm.address}
                    onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                    className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-100 space-x-2">
                <button type="button" onClick={() => setClientModalOpen(false)} className="dashboard-btn-secondary text-xs">Cancel</button>
                <button type="submit" className="dashboard-btn-primary text-xs">Save Client Profile</button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Create Contract */}
        {contractModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
            <form onSubmit={handleCreateContract} className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
                <h3 className="text-base font-bold flex items-center"><FileSignature className="w-5 h-5 mr-2" /> Draft Service Contract</h3>
                <button type="button" onClick={() => setContractModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Client Corporation *</label>
                  <select
                    required
                    value={contractForm.clientId}
                    onChange={(e) => setContractForm({ ...contractForm, clientId: e.target.value })}
                    className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none bg-slate-50"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Contract Name/Reference *</label>
                  <input
                    type="text"
                    required
                    value={contractForm.contractName}
                    placeholder="e.g. Manpower supply v1"
                    onChange={(e) => setContractForm({ ...contractForm, contractName: e.target.value })}
                    className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={contractForm.startDate}
                      onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                      className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      value={contractForm.endDate}
                      onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                      className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Service Fee %</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={contractForm.serviceChargePercentage}
                      onChange={(e) => setContractForm({ ...contractForm, serviceChargePercentage: e.target.value })}
                      className="block w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-center focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">CGST Tax %</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={contractForm.cgstPercentage}
                      onChange={(e) => setContractForm({ ...contractForm, cgstPercentage: e.target.value })}
                      className="block w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-center focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">SGST Tax %</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={contractForm.sgstPercentage}
                      onChange={(e) => setContractForm({ ...contractForm, sgstPercentage: e.target.value })}
                      className="block w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-center focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Terms & Conditions</label>
                  <textarea
                    rows={2}
                    value={contractForm.termsConditions}
                    onChange={(e) => setContractForm({ ...contractForm, termsConditions: e.target.value })}
                    className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-100 space-x-2">
                <button type="button" onClick={() => setContractModalOpen(false)} className="dashboard-btn-secondary text-xs">Cancel</button>
                <button type="submit" className="dashboard-btn-primary text-xs">Draft Contract</button>
              </div>
            </form>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
