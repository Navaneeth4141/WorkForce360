'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.js';
import API from '../../lib/api.js';
import { Settings, Save, AlertCircle, Plus, Trash2, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Settings State
  const [companyName, setCompanyName] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [defaultPfPercentage, setDefaultPfPercentage] = useState('12.0');
  const [defaultPfAdminPercentage, setDefaultPfAdminPercentage] = useState('1.0');
  const [defaultEsicPercentage, setDefaultEsicPercentage] = useState('3.25');
  const [maximumOtHoursPerDay, setMaximumOtHoursPerDay] = useState('8.0');
  const [professionalTaxSlabs, setProfessionalTaxSlabs] = useState([]);

  // Designations management states
  const [designations, setDesignations] = useState([]);
  const [newDesigName, setNewDesigName] = useState('');
  const [newDesigDesc, setNewDesigDesc] = useState('');

  const loadDesignations = async () => {
    try {
      const res = await API.get('/designations');
      setDesignations(res.data);
    } catch (err) {
      console.error('Failed to load designations', err);
    }
  };

  const handleAddDesignation = async (e) => {
    e.preventDefault();
    if (!newDesigName.trim()) return;
    try {
      setSuccessMsg('');
      setErrorMsg('');
      await API.post('/designations', { name: newDesigName, description: newDesigDesc });
      setNewDesigName('');
      setNewDesigDesc('');
      setSuccessMsg('Designation added successfully!');
      loadDesignations();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error?.message || 'Failed to add designation.');
    }
  };

  const handleDeleteDesignation = async (id) => {
    if (!confirm('Are you sure you want to remove this designation?')) return;
    try {
      setSuccessMsg('');
      setErrorMsg('');
      const res = await API.delete(`/designations/${id}`);
      setSuccessMsg(res.data.message || 'Designation removed successfully.');
      loadDesignations();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error?.message || 'Failed to remove designation.');
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const res = await API.get('/settings');
      const data = res.data;

      setCompanyName(data.companyName || '');
      setCompanyLogoUrl(data.companyLogoUrl || '');
      setAddress(data.address || '');
      setPhoneNumber(data.phoneNumber || '');
      setEmail(data.email || '');
      setGstNumber(data.gstNumber || '');
      setPanNumber(data.panNumber || '');
      setDefaultPfPercentage(data.defaultPfPercentage?.toString() || '12.0');
      setDefaultPfAdminPercentage(data.defaultPfAdminPercentage?.toString() || '1.0');
      setDefaultEsicPercentage(data.defaultEsicPercentage?.toString() || '3.25');
      setMaximumOtHoursPerDay(data.maximumOtHoursPerDay?.toString() || '8.0');
      setProfessionalTaxSlabs(data.professionalTaxSlabs || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load settings. Running in offline simulation.');
      setProfessionalTaxSlabs([
        { maxGross: 15000, pt: 0 },
        { maxGross: 20000, pt: 150 },
        { maxGross: 9999999, pt: 200 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadDesignations();
  }, []);

  // Professional Tax slabs helpers
  const handleAddSlab = () => {
    setProfessionalTaxSlabs(prev => [...prev, { maxGross: 0, pt: 0 }]);
  };

  const handleRemoveSlab = (index) => {
    setProfessionalTaxSlabs(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSlab = (index, field, val) => {
    const parsedVal = val === '' ? '' : parseFloat(val);
    setProfessionalTaxSlabs(prev => prev.map((item, i) => i === index ? { ...item, [field]: parsedVal } : item));
  };

  // Submit Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    // Slabs validation
    for (const slab of professionalTaxSlabs) {
      if (slab.maxGross === '' || slab.pt === '') {
        setErrorMsg('Please complete all professional tax slab values.');
        return;
      }
    }

    try {
      setSaveLoading(true);
      const payload = {
        companyName,
        companyLogoUrl,
        address,
        phoneNumber,
        email,
        gstNumber,
        panNumber,
        defaultPfPercentage: parseFloat(defaultPfPercentage) || 12.0,
        defaultPfAdminPercentage: parseFloat(defaultPfAdminPercentage) || 1.0,
        defaultEsicPercentage: parseFloat(defaultEsicPercentage) || 3.25,
        maximumOtHoursPerDay: parseFloat(maximumOtHoursPerDay) || 8.0,
        professionalTaxSlabs: professionalTaxSlabs.map(s => ({
          maxGross: parseFloat(s.maxGross) || 9999999,
          pt: parseFloat(s.pt) || 0
        }))
      };

      await API.put('/settings', payload);
      setSuccessMsg('System settings saved successfully!');
      loadSettings();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error?.message || 'Failed to update system settings.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Title bar */}
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
            <p className="text-sm text-slate-500 mt-0.5">Configure agency demographic details, default payroll rate percentages, and tax parameters.</p>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded text-emerald-800 text-xs font-semibold flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded text-amber-800 text-xs font-semibold flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-amber-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white border rounded-xl p-8 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading settings...
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            {/* 2. Payroll Configuration (Rates & limits) */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                Payroll Settings & Limits
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Default PF %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={defaultPfPercentage}
                    onChange={(e) => setDefaultPfPercentage(e.target.value)}
                    className="block w-full border border-slate-200 rounded px-3 py-2 text-xs bg-slate-50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Default PF Admin %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={defaultPfAdminPercentage}
                    onChange={(e) => setDefaultPfAdminPercentage(e.target.value)}
                    className="block w-full border border-slate-200 rounded px-3 py-2 text-xs bg-slate-50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Default ESIC %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={defaultEsicPercentage}
                    onChange={(e) => setDefaultEsicPercentage(e.target.value)}
                    className="block w-full border border-slate-200 rounded px-3 py-2 text-xs bg-slate-50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Max Daily OT Limit (Hrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={maximumOtHoursPerDay}
                    onChange={(e) => setMaximumOtHoursPerDay(e.target.value)}
                    className="block w-full border border-slate-200 rounded px-3 py-2 text-xs bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Professional Tax (PT) Slabs */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Professional Tax Slabs</h3>
                <button
                  type="button"
                  onClick={handleAddSlab}
                  className="dashboard-btn-secondary py-1 text-xs"
                >
                  + Add Slab
                </button>
              </div>

              <div className="space-y-3">
                {professionalTaxSlabs.map((slab, idx) => (
                  <div key={idx} className="flex items-center space-x-4 max-w-md bg-slate-50 rounded border border-slate-100 p-2 relative">
                    <div className="flex-1">
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Max Gross Salary (Rs)</label>
                      <input
                        type="number"
                        value={slab.maxGross}
                        onChange={(e) => handleUpdateSlab(idx, 'maxGross', e.target.value)}
                        className="block w-full border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Professional Tax (Rs)</label>
                      <input
                        type="number"
                        value={slab.pt}
                        onChange={(e) => handleUpdateSlab(idx, 'pt', e.target.value)}
                        className="block w-full border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:outline-none"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleRemoveSlab(idx)}
                      className="text-red-500 hover:text-red-700 pt-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Designation Management */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manage Company Designations</h3>
              </div>

              {/* Add Designation Inline Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-50 p-3 rounded-lg border border-slate-150">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Designation Name *</label>
                  <input
                    type="text"
                    value={newDesigName}
                    onChange={(e) => setNewDesigName(e.target.value)}
                    placeholder="e.g. Senior Developer"
                    className="block w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={newDesigDesc}
                    onChange={(e) => setNewDesigDesc(e.target.value)}
                    placeholder="e.g. Directs technical delivery"
                    className="block w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleAddDesignation}
                    className="dashboard-btn-primary w-full py-1.5 text-xs flex justify-center items-center"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Designation
                  </button>
                </div>
              </div>

              {/* List of active Designations */}
              <div className="space-y-2 mt-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Designations</h4>
                {designations.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No designations found.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {designations.map((d) => (
                      <div key={d.id} className="flex items-center justify-between bg-slate-50 rounded border border-slate-200 p-2.5">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-bold text-slate-700 truncate">{d.name}</p>
                          {d.description && <p className="text-[10px] text-slate-500 truncate">{d.description}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteDesignation(d.id)}
                          className="text-red-500 hover:text-red-700 shrink-0 p-1 rounded hover:bg-slate-100 transition-colors"
                          title="Remove Designation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={saveLoading}
                className="dashboard-btn-primary flex items-center"
              >
                {saveLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Save System Settings
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </AdminLayout>
  );
}
