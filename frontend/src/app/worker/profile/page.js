'use client';

import React, { useState, useEffect } from 'react';
import API from '../../../lib/api.js';
import { useAuth } from '../../../context/AuthContext.js';
import { 
  User, 
  BookOpen, 
  Briefcase, 
  CreditCard, 
  FileText, 
  Key, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function WorkerProfile() {
  const { changePassword } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  // Change Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await API.get('/employees/profile/me');
        setProfile(res.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

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

    setPwdSubmitting(true);
    const result = await changePassword(currentPassword, newPassword);
    setPwdSubmitting(false);

    if (result.success) {
      setPwdSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPwdError(result.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500">Loading your profile...</span>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', name: 'General Info', icon: User },
    { id: 'bank', name: 'Bank Details', icon: CreditCard },
    { id: 'education', name: 'Education', icon: BookOpen },
    { id: 'experience', name: 'Experience', icon: Briefcase },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'password', name: 'Security', icon: Key },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Personal Profile</h1>
        <p className="text-sm text-slate-500">View your personal records, bank listings, history files, and update credentials.</p>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-50 text-red-700 p-4 border border-red-200 rounded-xl text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Summary Card */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-blue-100 text-blue-600 border border-blue-200 rounded-full flex items-center justify-center font-bold text-3xl shadow-inner mb-4 relative overflow-hidden">
            {profile?.fullName ? profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'W'}
          </div>
          <h2 className="text-xl font-bold text-slate-800">{profile?.fullName}</h2>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full mt-1.5 uppercase">
            {profile?.designation?.name || 'Worker'}
          </span>
          <p className="text-xs text-slate-400 mt-2 font-medium">ID: {profile?.employeeCode}</p>

          <div className="w-full border-t border-slate-100 mt-6 pt-6 space-y-4 text-left text-xs">
            <div className="flex items-center space-x-3 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{profile?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{profile?.phoneNumber || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Joined {profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Tab Details */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          
          {/* Tabs Sidebar */}
          <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 p-4 space-y-1 shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Details Content Container */}
          <div className="flex-1 p-6 overflow-y-auto">
            
            {/* General Info Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">General Information</h3>
                  <p className="text-xs text-slate-400">Core personal and administrative details.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 font-medium">Full Name</span>
                    <p className="font-semibold text-slate-700 mt-0.5">{profile?.fullName}</p>
                  </div>
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 font-medium">Date of Birth (DOB)</span>
                    <p className="font-semibold text-slate-700 mt-0.5">{profile?.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 font-medium">Gender</span>
                    <p className="font-semibold text-slate-700 mt-0.5 uppercase">{profile?.gender || 'N/A'}</p>
                  </div>
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 font-medium">Nationality</span>
                    <p className="font-semibold text-slate-700 mt-0.5">{profile?.nationality || 'N/A'}</p>
                  </div>
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 font-medium">Religion</span>
                    <p className="font-semibold text-slate-700 mt-0.5">{profile?.religion || 'N/A'}</p>
                  </div>
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 font-medium">Aadhar Number</span>
                    <p className="font-semibold text-slate-700 mt-0.5">{profile?.aadharNumber || 'N/A'}</p>
                  </div>
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 font-medium">Provident Fund (PF) No.</span>
                    <p className="font-semibold text-slate-700 mt-0.5">{profile?.pfNumber || 'Not Enrolled'}</p>
                  </div>
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 font-medium">ESIC Number</span>
                    <p className="font-semibold text-slate-700 mt-0.5">{profile?.esicNumber || 'Not Enrolled'}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 font-medium flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> Present Address
                    </span>
                    <p className="font-semibold text-slate-700 mt-1">{profile?.presentAddress || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> Permanent Address
                    </span>
                    <p className="font-semibold text-slate-700 mt-1">{profile?.permanentAddress || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Details Tab */}
            {activeTab === 'bank' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Bank Details</h3>
                  <p className="text-xs text-slate-400">Payroll disbursement account routing information.</p>
                </div>

                {profile?.bankDetails ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Bank Name</span>
                      <p className="font-semibold text-slate-700 mt-0.5">{profile.bankDetails.bankName}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Account Holder Name</span>
                      <p className="font-semibold text-slate-700 mt-0.5">{profile.bankDetails.accountHolderName}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Account Number</span>
                      <p className="font-mono font-semibold text-slate-700 mt-0.5">{profile.bankDetails.accountNumber}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">IFSC Code</span>
                      <p className="font-mono font-semibold text-slate-700 mt-0.5">{profile.bankDetails.ifscCode}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-xs text-slate-400 font-medium">Branch Location</span>
                      <p className="font-semibold text-slate-700 mt-0.5">{profile.bankDetails.branchName}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No bank details linked to your employee record. Contact HR to link bank details.
                  </div>
                )}
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Academic Background</h3>
                  <p className="text-xs text-slate-400">Summary of degrees and certifications.</p>
                </div>

                {profile?.education && profile.education.length > 0 ? (
                  <div className="space-y-4">
                    {profile.education.map((edu) => (
                      <div key={edu.id} className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                          <h4 className="font-bold text-slate-700 text-sm">{edu.qualification}</h4>
                          <p className="text-xs text-slate-400">{edu.institution} {edu.specialization ? `| ${edu.specialization}` : ''}</p>
                        </div>
                        <div className="mt-2 md:mt-0 text-right md:text-left flex items-center space-x-4">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Score</span>
                            <p className="text-xs font-bold text-slate-700">{edu.score} {edu.scoreType === 'PERCENTAGE' ? '%' : 'GPA'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Completed</span>
                            <p className="text-xs font-bold text-slate-700">{edu.completionYear}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No education records listed on profile.
                  </div>
                )}
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Employment History</h3>
                  <p className="text-xs text-slate-400">Previous work history and years of experience.</p>
                </div>

                {profile?.employmentHistory && profile.employmentHistory.length > 0 ? (
                  <div className="space-y-4">
                    {profile.employmentHistory.map((job) => (
                      <div key={job.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-slate-700 text-sm">{job.designation}</h4>
                          <p className="text-xs text-slate-400">{job.employerName}</p>
                        </div>
                        <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                          {job.experienceYears} Years
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No prior employment records listed.
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Uploaded Documents</h3>
                  <p className="text-xs text-slate-400">Links to digital copies of identity and enrollment certificates.</p>
                </div>

                {profile?.documents && profile.documents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.documents.map((doc) => (
                      <div key={doc.id} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">{doc.documentType.replace('_', ' ')}</p>
                            <span className="text-[10px] text-slate-400">Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <a 
                          href={doc.cloudinaryUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-blue-600 hover:text-blue-700"
                        >
                          View File
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No documents uploaded on file.
                  </div>
                )}
              </div>
            )}

            {/* Security / Password Tab */}
            {activeTab === 'password' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Account Security</h3>
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
    </div>
  );
}
