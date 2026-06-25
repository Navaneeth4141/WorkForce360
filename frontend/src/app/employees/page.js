'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout.js';
import API from '../../lib/api.js';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Lock,
  Download,
  X,
  CreditCard,
  Calendar,
  FileText,
  Briefcase,
  User as UserIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal State
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [empDetails, setEmpDetails] = useState(null);

  // Edit Modal State
  const [editEmp, setEditEmp] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '', phoneNumber: '', email: '', presentAddress: '', permanentAddress: '',
    pfNumber: '', esicNumber: '', designationId: '', status: 'ACTIVE', religion: '',
    bankDetails: { bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '', branchName: '' },
    fixedGross: '', teaAllowance: '500', fixedBasic: '', fixedHra: '', fixedConveyance: ''
  });

  const [message, setMessage] = useState('');

  // Fetch employees list
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/employees?search=${search}&designationId=${designationId}&page=${page}&limit=8`);
      setEmployees(res.data.employees);
      setTotalPages(res.data.meta.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [search, designationId, page]);

  // Fetch designations
  useEffect(() => {
    async function loadDesignations() {
      try {
        const res = await API.get('/designations');
        setDesignations(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadDesignations();
  }, []);

  // Fetch full details when an employee is selected
  const handleViewDetails = async (emp) => {
    try {
      const res = await API.get(`/employees/${emp.id}`);
      setEmpDetails(res.data);
      setSelectedEmp(emp);
      setActiveTab('profile');
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger password reset
  const handleResetPassword = async (code) => {
    const expectedPassword = code.startsWith('ESS') 
      ? code.replace('ESS', 'ESS@') 
      : `${code}@123`;
    if (!confirm(`Are you sure you want to reset password for employee ${code} to default "${expectedPassword}"?`)) return;
    try {
      const res = await API.post('/auth/reset-password', { employeeId: code });
      alert(`Password reset successful. New default password: ${res.data.defaultPassword}`);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Password reset failed');
    }
  };

  // Trigger employee deactivation
  const handleDeactivate = async (id, code) => {
    if (!confirm(`Are you sure you want to deactivate employee ${code}? This soft-deletes their profile and user account.`)) return;
    try {
      await API.delete(`/employees/${id}`);
      setMessage(`Employee ${code} deactivated successfully`);
      loadEmployees();
      setSelectedEmp(null);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to deactivate employee');
    }
  };

  // Open edit modal
  const handleOpenEdit = (emp) => {
    setEditEmp(emp);
    const activeSalary = emp.salaryStructures?.[0] || {};
    setEditForm({
      fullName: emp.fullName,
      phoneNumber: emp.phoneNumber,
      email: emp.email,
      presentAddress: emp.presentAddress || '',
      permanentAddress: emp.permanentAddress || '',
      pfNumber: emp.pfNumber || '',
      esicNumber: emp.esicNumber || '',
      designationId: emp.designationId,
      status: emp.status,
      religion: emp.religion || '',
      bankDetails: {
        bankName: emp.bankDetails?.bankName || '',
        accountHolderName: emp.bankDetails?.accountHolderName || '',
        accountNumber: emp.bankDetails?.accountNumber || '',
        ifscCode: emp.bankDetails?.ifscCode || '',
        branchName: emp.bankDetails?.branchName || ''
      },
      fixedGross: activeSalary.fixedGross || '',
      teaAllowance: activeSalary.teaAllowance || '500',
      fixedBasic: activeSalary.fixedBasic || '',
      fixedHra: activeSalary.fixedHra || '',
      fixedConveyance: activeSalary.fixedConveyance || ''
    });
  };

  // Submit edit form
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();

    if (!editForm.pfNumber || !editForm.pfNumber.trim()) {
      alert('UAN Number (PF Number) is required');
      return;
    }

    if (editForm.esicNumber !== 'N/A' && (!editForm.esicNumber || !editForm.esicNumber.trim())) {
      alert('ESIC Insurance Number is required when eligible');
      return;
    }

    // Validate optional phone number and email formats if provided
    if (editForm.phoneNumber && editForm.phoneNumber.trim()) {
      if (!/^\d{10}$/.test(editForm.phoneNumber.trim())) {
        alert('Phone number must be exactly 10 digits');
        return;
      }
    }

    if (editForm.email && editForm.email.trim()) {
      if (!editForm.email.includes('@')) {
        alert('Email must contain the "@" character');
        return;
      }
    }
    
    // Check if salary parameters are provided and validate component sum equals gross
    if (editForm.fixedGross !== '') {
      const gross = parseFloat(editForm.fixedGross || 0);
      const tea = parseFloat(editForm.teaAllowance || 0);
      const basic = parseFloat(editForm.fixedBasic || 0);
      const hra = parseFloat(editForm.fixedHra || 0);
      const conveyance = parseFloat(editForm.fixedConveyance || 0);
      const sum = basic + hra + conveyance + tea;

      if (Math.abs(sum - gross) > 0.01) {
        alert('Salary component total must equal Fixed Gross Salary.');
        return;
      }
    }

    try {
      const payload = {
        ...editForm,
        fixedGross: editForm.fixedGross !== '' ? parseFloat(editForm.fixedGross) : null,
        teaAllowance: editForm.teaAllowance !== '' ? parseFloat(editForm.teaAllowance) : 0,
        fixedBasic: editForm.fixedBasic !== '' ? parseFloat(editForm.fixedBasic) : 0,
        fixedHra: editForm.fixedHra !== '' ? parseFloat(editForm.fixedHra) : 0,
        fixedConveyance: editForm.fixedConveyance !== '' ? parseFloat(editForm.fixedConveyance) : 0,
      };

      await API.put(`/employees/${editEmp.id}`, payload);
      setEditEmp(null);
      setMessage('Employee updated successfully');
      loadEmployees();
      if (selectedEmp?.id === editEmp.id) {
        handleViewDetails(editEmp); // refresh detail sheet
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update employee');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Title bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Employee Records</h2>
            <p className="text-sm text-slate-500 mt-0.5">Manage onboarded workers, edit structures, and reset default credentials.</p>
          </div>
          <Link href="/employees/onboard" className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors shrink-0">
            <Plus className="w-4 h-4 mr-2" /> Onboard Employee
          </Link>
        </div>

        {/* Global Alert */}
        {message && (
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded text-emerald-800 text-xs font-semibold flex justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-emerald-500 hover:text-emerald-700">✕</button>
          </div>
        )}

        {/* Filters bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by code, name, phone, or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="block w-full border border-slate-200 rounded pl-9 pr-4 py-2 text-sm bg-slate-50 focus:outline-none"
            />
          </div>
          <div className="w-full md:w-64">
            <select
              value={designationId}
              onChange={(e) => { setDesignationId(e.target.value); setPage(1); }}
              className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
            >
              <option value="">All Designations</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Employees Table List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-200">
                  <th className="p-4">Employee ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Designation</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date Joined</th>
                  <th className="p-4">Gross Salary</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Loading employees...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 italic">No employees found.</td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-semibold text-blue-600">{emp.employeeCode}</td>
                      <td className="p-4 font-medium text-slate-900">{emp.fullName}</td>
                      <td className="p-4">{emp.phoneNumber}</td>
                      <td className="p-4">{emp.designation?.name || 'Worker'}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          emp.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : emp.status === 'INACTIVE'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="p-4">{new Date(emp.joiningDate).toLocaleDateString()}</td>
                      <td className="p-4 font-semibold">
                        {emp.salaryStructures?.[0] ? `Rs. ${Math.round(parseFloat(emp.salaryStructures[0].fixedGross)).toLocaleString('en-IN')}` : 'N/A'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(emp)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1 rounded hover:bg-slate-100 text-blue-600 transition-colors"
                            title="Edit Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(emp.employeeCode)}
                            className="p-1 rounded hover:bg-slate-100 text-amber-600 transition-colors"
                            title="Reset Password to default"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeactivate(emp.id, emp.employeeCode)}
                            className="p-1 rounded hover:bg-slate-100 text-red-600 transition-colors"
                            title="Deactivate worker"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-white">
              <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded border border-slate-200 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded border border-slate-200 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Employee Details Tabs */}
        {selectedEmp && empDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
                <div>
                  <h3 className="text-base font-bold">{empDetails.fullName}</h3>
                  <p className="text-xs text-slate-400">{empDetails.employeeCode} | {empDetails.designation?.name || 'Worker'}</p>
                </div>
                <button onClick={() => setSelectedEmp(null)} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs Navigation */}
              <div className="flex border-b border-slate-200 px-6 bg-slate-50 text-sm font-semibold text-slate-500">
                {[
                  { id: 'profile', label: 'Profile Card', icon: UserIcon },
                  { id: 'attendance', label: 'Attendance', icon: Calendar },
                  { id: 'payroll', label: 'Payroll Snapshots', icon: CreditCard },
                  { id: 'documents', label: 'Uploaded Documents', icon: FileText }
                ].map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`flex items-center px-4 py-3 border-b-2 transition-all ${
                        activeTab === t.id
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent hover:text-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" /> {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Modal Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                
                {/* Tab: Profile */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Employment Details</h4>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between"><span className="text-slate-500">Age / DOB:</span><span className="font-medium">{empDetails.age} yrs / {new Date(empDetails.dob).toLocaleDateString()}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Nationality:</span><span className="font-medium">{empDetails.nationality}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Gender / Religion:</span><span className="font-medium">{empDetails.gender} / {empDetails.religion}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Phone Number:</span><span className="font-medium">{empDetails.phoneNumber}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Email Address:</span><span className="font-medium">{empDetails.email}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Aadhaar Number:</span><span className="font-medium">{empDetails.aadharNumber}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">UAN Number:</span><span className="font-medium">{empDetails.pfNumber || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">ESIC Number:</span><span className="font-medium">{empDetails.esicNumber || 'N/A'}</span></div>
                        </div>
                      </div>

                      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Bank Accounts info</h4>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between"><span className="text-slate-500">Bank Name:</span><span className="font-medium">{empDetails.bankDetails?.bankName || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Account Holder:</span><span className="font-medium">{empDetails.bankDetails?.accountHolderName || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Account Number:</span><span className="font-medium">{empDetails.bankDetails?.accountNumber || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">IFSC Code:</span><span className="font-medium">{empDetails.bankDetails?.ifscCode || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Branch Name:</span><span className="font-medium">{empDetails.bankDetails?.branchName || 'N/A'}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-2">
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Family Members</h4>
                        {empDetails.familyMembers.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No dependents logged.</p>
                        ) : (
                          <ul className="divide-y divide-slate-100 text-xs">
                            {empDetails.familyMembers.map((fam, idx) => (
                              <li key={idx} className="py-2 flex justify-between">
                                <span>{fam.fullName} ({fam.relationship})</span>
                                <span className="text-slate-500">{fam.occupation || 'Dependent'}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-2">
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Salary Structures configuration</h4>
                        {empDetails.salaryStructures.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No salary parameters set.</p>
                        ) : (
                          <div className="text-xs space-y-2">
                            {empDetails.salaryStructures.map((s, idx) => (
                              <div key={idx} className="space-y-1.5">
                                <div className="flex justify-between"><span className="text-slate-500">Fixed Gross:</span><span className="font-semibold text-slate-800">Rs. {s.fixedGross}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Tea Allowance:</span><span>Rs. {s.teaAllowance}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Basic:</span><span>Rs. {s.fixedBasic}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">HRA:</span><span>Rs. {s.fixedHra}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Conveyance:</span><span>Rs. {s.fixedConveyance}</span></div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Attendance Logs */}
                {activeTab === 'attendance' && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800">Attendance Log History</h4>
                    <p className="text-xs text-slate-400">Shows daily clockings and overtime logs.</p>
                    {/* Placeholder attendance history table */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                            <th className="p-3">Date</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">OT Hours</th>
                            <th className="p-3">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          {empDetails.attendances && empDetails.attendances.length > 0 ? (
                            empDetails.attendances.map((att, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold">{new Date(att.attendanceDate).toLocaleDateString()}</td>
                                <td className="p-3">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[3px] font-bold ${
                                    att.attendanceStatus === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                  }`}>
                                    {att.attendanceStatus}
                                  </span>
                                </td>
                                <td className="p-3">{att.overtimeHours} hrs</td>
                                <td className="p-3">{att.remarks || '-'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-slate-400 italic">No attendance records found for this employee.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab: Payroll History */}
                {activeTab === 'payroll' && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800">Payroll Run History</h4>
                    <p className="text-xs text-slate-400">Lists monthly takings ledger snapshots.</p>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                            <th className="p-3">Wages Period</th>
                            <th className="p-3">Paid Days</th>
                            <th className="p-3">Gross Billed (Rs)</th>
                            <th className="p-3">PF Deduct (Rs)</th>
                            <th className="p-3">Net Taken (Rs)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          {empDetails.payrollItems && empDetails.payrollItems.length > 0 ? (
                            empDetails.payrollItems.map((pay, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold">Batch #{pay.payrollBatchId.substring(0, 5)}</td>
                                <td className="p-3">{pay.payableDays} days</td>
                                <td className="p-3 font-semibold">Rs. {pay.grossPay}</td>
                                <td className="p-3">Rs. {pay.pf}</td>
                                <td className="p-3 font-bold text-emerald-600">Rs. {pay.netSalary}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400 italic">No payroll batch snapshots logged.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab: Documents */}
                {activeTab === 'documents' && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800">Document Upload list</h4>
                    <p className="text-xs text-slate-400">Scans cataloged during onboarding.</p>
                    
                    {empDetails.documents && empDetails.documents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {empDetails.documents.map((doc, idx) => (
                          <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex items-center justify-between">
                            <div>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 mb-1">
                                {doc.documentType}
                              </span>
                              <p className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">
                                File Ref #{doc.id.substring(0, 8)}
                              </p>
                            </div>
                            <a
                              href={doc.cloudinaryUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="dashboard-btn-secondary py-1 text-xs flex items-center"
                            >
                              <Download className="w-3.5 h-3.5 mr-1" /> View/Download
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No documents uploaded.</p>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit Employee Details */}
        {editEmp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
            <form onSubmit={handleUpdateEmployee} className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
                <h3 className="text-base font-bold">Edit Employee Details: {editEmp.employeeCode}</h3>
                <button type="button" onClick={() => setEditEmp(null)} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                
                {/* Personal Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Personal Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number (Optional)</label>
                      <input
                        type="text"
                        value={editForm.phoneNumber}
                        onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                        className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Email (Optional)</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                      >
                        <option>ACTIVE</option>
                        <option>INACTIVE</option>
                        <option>RESIGNED</option>
                        <option>TERMINATED</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Designation *</label>
                      <select
                        value={editForm.designationId}
                        onChange={(e) => setEditForm({ ...editForm, designationId: e.target.value })}
                        className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                      >
                        {designations.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Religion (Optional)</label>
                      <input
                        type="text"
                        value={editForm.religion}
                        onChange={(e) => setEditForm({ ...editForm, religion: e.target.value })}
                        className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">UAN Number *</label>
                      <input
                        type="text"
                        required
                        value={editForm.pfNumber}
                        onChange={(e) => setEditForm({ ...editForm, pfNumber: e.target.value })}
                        className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">ESIC Eligible? *</label>
                      <select
                        value={editForm.esicNumber === 'N/A' ? 'No' : 'Yes'}
                        onChange={(e) => {
                          const isEligible = e.target.value === 'Yes';
                          setEditForm({
                            ...editForm,
                            esicNumber: isEligible ? '' : 'N/A'
                          });
                        }}
                        className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    {editForm.esicNumber !== 'N/A' && (
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">ESIC Insurance Number *</label>
                        <input
                          type="text"
                          required
                          value={editForm.esicNumber}
                          onChange={(e) => setEditForm({ ...editForm, esicNumber: e.target.value })}
                          className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Bank Account details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={editForm.bankDetails.bankName}
                        onChange={(e) => setEditForm({
                           ...editForm,
                           bankDetails: { ...editForm.bankDetails, bankName: e.target.value }
                        })}
                        className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={editForm.bankDetails.accountNumber}
                        onChange={(e) => setEditForm({
                           ...editForm,
                           bankDetails: { ...editForm.bankDetails, accountNumber: e.target.value }
                        })}
                        className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={editForm.bankDetails.ifscCode}
                        onChange={(e) => setEditForm({
                           ...editForm,
                           bankDetails: { ...editForm.bankDetails, ifscCode: e.target.value }
                        })}
                        className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Branch Name</label>
                      <input
                        type="text"
                        value={editForm.bankDetails.branchName}
                        onChange={(e) => setEditForm({
                           ...editForm,
                           bankDetails: { ...editForm.bankDetails, branchName: e.target.value }
                        })}
                        className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Salary Structure Configuration */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Salary Structure Configuration</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Fixed Gross Salary (Monthly) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editForm.fixedGross}
                        onChange={(e) => setEditForm({ ...editForm, fixedGross: e.target.value })}
                        className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Tea Allowance *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editForm.teaAllowance}
                        onChange={(e) => setEditForm({ ...editForm, teaAllowance: e.target.value })}
                        className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Fixed Basic *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editForm.fixedBasic}
                        onChange={(e) => setEditForm({ ...editForm, fixedBasic: e.target.value })}
                        className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Fixed HRA *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editForm.fixedHra}
                        onChange={(e) => setEditForm({ ...editForm, fixedHra: e.target.value })}
                        className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Fixed Conveyance *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editForm.fixedConveyance}
                        onChange={(e) => setEditForm({ ...editForm, fixedConveyance: e.target.value })}
                        className="block w-full border border-slate-200 rounded px-3 py-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2 text-xs text-slate-500 pt-2 border-t border-slate-100 space-y-1">
                      <div>
                        Component Total: Rs. {parseFloat(editForm.fixedBasic || 0) + parseFloat(editForm.fixedHra || 0) + parseFloat(editForm.fixedConveyance || 0) + parseFloat(editForm.teaAllowance || 0)}
                      </div>
                      {editForm.fixedGross && Math.abs((parseFloat(editForm.fixedBasic || 0) + parseFloat(editForm.fixedHra || 0) + parseFloat(editForm.fixedConveyance || 0) + parseFloat(editForm.teaAllowance || 0)) - parseFloat(editForm.fixedGross || 0)) > 0.01 && (
                        <div className="text-red-500 font-semibold">
                          Difference from Gross: Rs. {parseFloat(editForm.fixedGross || 0) - (parseFloat(editForm.fixedBasic || 0) + parseFloat(editForm.fixedHra || 0) + parseFloat(editForm.fixedConveyance || 0) + parseFloat(editForm.teaAllowance || 0))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-100 space-x-2">
                <button type="button" onClick={() => setEditEmp(null)} className="dashboard-btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" className="dashboard-btn-primary text-xs">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
