'use client';
 
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.js';
import API from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { 
  Building, 
  Key, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  Save, 
  Eye, 
  EyeOff, 
  ShieldCheck 
} from 'lucide-react';
 
export default function AdminProfilePage() {
  const { user, changePassword, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('company');

  const handleResetDatabase = async () => {
    if (!confirm("WARNING: This will completely delete all data in the database (employees, attendance, payroll, expenses, invoices, etc.) but preserve the structure and restore the default admin login ('admin' / 'elitestaffing').\n\nAre you sure you want to proceed?")) {
      return;
    }

    try {
      setResetLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      await API.post('/settings/reset-database');
      alert("Database reset completed successfully. You will now be logged out. Use default credentials 'admin' / 'elitestaffing' to log back in.");
      logout();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error?.message || 'Failed to reset database.');
    } finally {
      setResetLoading(false);
    }
  };
 
  // Company Profile State
  const [companyName, setCompanyName] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
 
  // Keep other settings to avoid overwriting them
  const [payrollConfig, setPayrollConfig] = useState({});
 
  // Change Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
 
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
 
      setPayrollConfig({
        defaultPfPercentage: data.defaultPfPercentage,
        defaultPfAdminPercentage: data.defaultPfAdminPercentage,
        defaultEsicPercentage: data.defaultEsicPercentage,
        maximumOtHoursPerDay: data.maximumOtHoursPerDay,
        professionalTaxSlabs: data.professionalTaxSlabs,
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load company profile settings.');
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    loadSettings();
  }, []);
 
  const handleSaveCompanyProfile = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
 
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
        ...payrollConfig,
      };
 
      await API.put('/settings', payload);
      setSuccessMsg('Company profile updated successfully!');
      loadSettings();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error?.message || 'Failed to update company profile.');
    } finally {
      setSaveLoading(false);
    }
  };
 
  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
 
    if (!currentPassword) {
      setPwdError('Current password is required.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match.');
      return;
    }
 
    try {
      setPwdSubmitting(true);
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        setPwdSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdError(result.message);
      }
    } catch (err) {
      setPwdError('An error occurred while updating the password.');
    } finally {
      setPwdSubmitting(false);
    }
  };
 
  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Company & Admin Profile</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage details of your agency and update administrator account credentials.</p>
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
            Loading profile details...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Column: Summary Card */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-blue-100 text-blue-600 border border-blue-200 rounded-2xl flex items-center justify-center font-bold text-3xl shadow-inner mb-4 relative overflow-hidden">
                <Building className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">{companyName || 'Elite Staffing'}</h2>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full mt-1.5 uppercase">
                {user?.role || 'ADMIN'}
              </span>
              <p className="text-xs text-slate-400 mt-2 font-medium">Console Profile</p>
 
              <div className="w-full border-t border-slate-100 mt-6 pt-6 space-y-4 text-left text-xs">
                <div className="flex items-center space-x-3 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{email || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{phoneNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="line-clamp-2">{address || 'N/A'}</span>
                </div>
              </div>
 
              {/* Danger Zone */}
              <div className="w-full border-t border-red-100 mt-6 pt-6 text-left">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block mb-2">Danger Zone</span>
                <button
                  type="button"
                  onClick={handleResetDatabase}
                  disabled={resetLoading}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 text-red-600 hover:text-red-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {resetLoading ? 'Resetting Database...' : 'Delete DataBase'}
                </button>
              </div>
            </div>
 
            {/* Right Column: Tabbed Details */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
              
              {/* Tabs Sidebar */}
              <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 p-4 space-y-1 shrink-0">
                <button
                  onClick={() => setActiveTab('company')}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    activeTab === 'company'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Building className="w-4 h-4 shrink-0" />
                  <span>Company Details</span>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    activeTab === 'security'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Key className="w-4 h-4 shrink-0" />
                  <span>Security</span>
                </button>
              </div>
 
              {/* Tab Content Container */}
              <div className="flex-1 p-6 overflow-y-auto">
                
                {/* Tab: Company Details */}
                {activeTab === 'company' && (
                  <form onSubmit={handleSaveCompanyProfile} className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Company Profile Settings</h3>
                      <p className="text-xs text-slate-400">Configure agency demographics and business identifiers.</p>
                    </div>
 
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name *</label>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="block w-full border border-slate-200 rounded px-3 py-2 text-xs bg-slate-50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Company Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full border border-slate-200 rounded px-3 py-2 text-xs bg-slate-50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Company Phone</label>
                        <input
                          type="text"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="block w-full border border-slate-200 rounded px-3 py-2 text-xs bg-slate-50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Company GSTIN</label>
                        <input
                          type="text"
                          value={gstNumber}
                          onChange={(e) => setGstNumber(e.target.value)}
                          className="block w-full border border-slate-200 rounded px-3 py-2 text-xs bg-slate-50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Company PAN</label>
                        <input
                          type="text"
                          value={panNumber}
                          onChange={(e) => setPanNumber(e.target.value)}
                          className="block w-full border border-slate-200 rounded px-3 py-2 text-xs bg-slate-50 focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Registered Address</label>
                        <textarea
                          rows={3}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="block w-full border border-slate-200 rounded px-3 py-2 text-xs bg-slate-50 focus:outline-none"
                        />
                      </div>
                    </div>
 
                    <div className="flex items-center justify-end border-t border-slate-100 pt-4">
                      <button
                        type="submit"
                        disabled={saveLoading}
                        className="dashboard-btn-primary flex items-center"
                      >
                        {saveLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" /> Save Company Details
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
 
                {/* Tab: Security */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Admin Account Security</h3>
                      <p className="text-xs text-slate-400">Change your portal login credentials.</p>
                    </div>
 
                    {pwdError && (
                      <div className="flex items-center space-x-2 bg-red-50 text-red-700 p-4 border border-red-200 rounded-xl text-sm font-medium">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{pwdError}</span>
                      </div>
                    )}
 
                    {pwdSuccess && (
                      <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 p-4 border border-emerald-200 rounded-xl text-sm font-medium">
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <span>{pwdSuccess}</span>
                      </div>
                    )}
 
                    <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1" htmlFor="currentPassword">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            id="currentPassword"
                            type={showCurrent ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="block w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrent(!showCurrent)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                          >
                            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
 
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1" htmlFor="newPassword">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            id="newPassword"
                            type={showNew ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="block w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                          >
                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
 
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1" htmlFor="confirmPassword">
                          Confirm New Password
                        </label>
                        <input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="block w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          required
                        />
                      </div>
 
                      <button
                        type="submit"
                        disabled={pwdSubmitting}
                        className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-md transition-colors disabled:opacity-50"
                      >
                        {pwdSubmitting ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>
                )}
 
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
