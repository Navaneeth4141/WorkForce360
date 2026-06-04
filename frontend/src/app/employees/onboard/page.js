'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../../components/AdminLayout.js';
import API from '../../../lib/api.js';
import {
  User,
  Users,
  GraduationCap,
  Briefcase,
  DollarSign,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trash2
} from 'lucide-react';

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [onboardResult, setOnboardResult] = useState(null);

  // Form State
  const [personal, setPersonal] = useState({
    fullName: '', age: '', dob: '', nationality: 'Indian', gender: 'Male', religion: '',
    phoneNumber: '', email: '', presentAddress: '', permanentAddress: '',
    aadharNumber: '', pfNumber: '', esicNumber: '', joiningDate: '', designationId: ''
  });

  const [family, setFamily] = useState([]); // list of { relationship, fullName, occupation, dob, contactNumber }
  const [education, setEducation] = useState([]); // list of { qualification, institution, specialization, completionYear, score, scoreType }
  const [history, setHistory] = useState([]); // list of { employerName, designation, experienceYears }

  const [salary, setSalary] = useState({
    fixedGross: '',
    teaAllowance: '500', // default Rs 500
    basicPercentage: '40',
    hraPercentage: '30',
    conveyancePercentage: '30'
  });

  const [documents, setDocuments] = useState({
    PHOTO: null, AADHAAR: null, PAN: null, PASSBOOK: null, JOINING_FORM: null, PF: null, ESIC: null
  });

  const [formErrors, setFormErrors] = useState({});

  // Fetch designations on load
  useEffect(() => {
    async function loadDesignations() {
      try {
        const res = await API.get('/designations');
        setDesignations(res.data);
        if (res.data.length > 0) {
          setPersonal(prev => ({ ...prev, designationId: res.data[0].id }));
        }
      } catch (err) {
        console.error('Failed to load designations', err);
      }
    }
    loadDesignations();
  }, []);

  // Validation rules per step
  const validateStep = () => {
    const errors = {};
    if (step === 1) {
      if (!personal.fullName.trim()) {
        errors.fullName = 'Full Name is required';
      }
      if (!personal.age || parseInt(personal.age) <= 0) {
        errors.age = 'Valid positive age is required';
      }
      if (!personal.dob) {
        errors.dob = 'Date of Birth is required';
      }
      if (!personal.designationId) {
        errors.designationId = 'Designation is required';
      }
      if (!personal.gender) {
        errors.gender = 'Gender is required';
      }
      if (!personal.nationality.trim()) {
        errors.nationality = 'Nationality is required';
      }
      if (!personal.religion.trim()) {
        errors.religion = 'Religion is required';
      }
      if (personal.phoneNumber && personal.phoneNumber.trim()) {
        if (!/^\d{10}$/.test(personal.phoneNumber.trim())) {
          errors.phoneNumber = 'Phone number must be exactly 10 digits';
        }
      }
      if (personal.email && personal.email.trim()) {
        if (!personal.email.includes('@')) {
          errors.email = 'Email must contain the "@" character';
        }
      }
      if (!personal.joiningDate) {
        errors.joiningDate = 'Joining Date is required';
      }
      if (!personal.aadharNumber.trim()) {
        errors.aadharNumber = 'Aadhaar Number is required';
      } else if (!/^\d{12}$/.test(personal.aadharNumber.trim())) {
        errors.aadharNumber = 'Aadhaar number must be exactly 12 digits';
      }
      if (!personal.pfNumber || !personal.pfNumber.trim()) {
        errors.pfNumber = 'PF Account Number is required';
      }
      if (!personal.esicNumber || !personal.esicNumber.trim()) {
        errors.esicNumber = 'ESIC Insurance Number is required';
      }
    } else if (step === 5) {
      if (!salary.fixedGross || parseFloat(salary.fixedGross) <= 0) {
        errors.fixedGross = 'Fixed Gross Salary must be greater than 0';
      }
      const sum = parseFloat(salary.basicPercentage) + parseFloat(salary.hraPercentage) + parseFloat(salary.conveyancePercentage);
      if (Math.abs(sum - 100) > 0.01) {
        errors.percentages = 'Salary percentages must sum to exactly 100%';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  // Family members dynamic list helpers
  const addFamilyMember = () => {
    setFamily(prev => [...prev, { relationship: 'FATHER', fullName: '', occupation: '', dob: '', contactNumber: '' }]);
  };

  const removeFamilyMember = (index) => {
    setFamily(prev => prev.filter((_, i) => i !== index));
  };

  const updateFamilyMember = (index, field, value) => {
    setFamily(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  // Education dynamic list helpers
  const addEducation = () => {
    setEducation(prev => [...prev, { qualification: '', institution: '', specialization: '', completionYear: '', score: '', scoreType: 'PERCENTAGE' }]);
  };

  const removeEducation = (index) => {
    setEducation(prev => prev.filter((_, i) => i !== index));
  };

  const updateEducation = (index, field, value) => {
    setEducation(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  // History dynamic list helpers
  const addHistory = () => {
    setHistory(prev => [...prev, { employerName: '', designation: '', experienceYears: '' }]);
  };

  const removeHistory = (index) => {
    setHistory(prev => prev.filter((_, i) => i !== index));
  };

  const updateHistory = (index, field, value) => {
    setHistory(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  // Mock document upload simulate
  const handleFileUpload = (type, e) => {
    const file = e.target.files[0];
    if (file) {
      // Simulate file upload setting URL
      setDocuments(prev => ({
        ...prev,
        [type]: {
          fileName: file.name,
          url: `/storage/documents/mock-${type.toLowerCase()}-${Date.now()}.jpg`
        }
      }));
    }
  };

  // Submit onboarding details
  const handleFinish = async () => {
    setLoading(true);
    setFormErrors({});

    try {
      const payload = {
        ...personal,
        age: parseInt(personal.age, 10) || 0,
        bankDetails: {
          bankName: 'State Bank of India',
          accountHolderName: personal.fullName,
          accountNumber: '10000000000',
          ifscCode: 'SBIN0000001',
          branchName: 'Main Branch'
        },
        familyMembers: family.map(f => ({
          ...f,
          dob: f.dob ? new Date(f.dob).toISOString() : null
        })),
        education: education.map(e => ({
          ...e,
          completionYear: parseInt(e.completionYear, 10) || 0,
          score: parseFloat(e.score) || 0.0
        })),
        employmentHistory: history.map(h => ({
          ...h,
          experienceYears: parseFloat(h.experienceYears) || 0.0
        })),
        // Step 5: Salary structure configuration
        fixedGross: parseFloat(salary.fixedGross),
        teaAllowance: parseFloat(salary.teaAllowance),
        basicPercentage: parseFloat(salary.basicPercentage),
        hraPercentage: parseFloat(salary.hraPercentage),
        conveyancePercentage: parseFloat(salary.conveyancePercentage),
        
        // Step 6: Documents
        documents: Object.entries(documents)
          .filter(([_, file]) => file !== null)
          .map(([type, file]) => ({
            documentType: type,
            cloudinaryUrl: file.url
          }))
      };

      const res = await API.post('/employees', payload);
      setOnboardResult(res.data);
    } catch (err) {
      console.error(err);
      setFormErrors({ submit: err.response?.data?.error?.message || 'Failed to onboard employee.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Onboard New Employee</h2>
          <p className="text-sm text-slate-500 mt-1">Complete all steps to digitize worker records and assign salary structures.</p>
        </div>

        {/* Wizard Steps indicator */}
        {!onboardResult && (
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            {[
              { num: 1, label: 'Personal', icon: User },
              { num: 2, label: 'Family', icon: Users },
              { num: 3, label: 'Education', icon: GraduationCap },
              { num: 4, label: 'History', icon: Briefcase },
              { num: 5, label: 'Salary', icon: DollarSign },
              { num: 6, label: 'Documents', icon: Upload }
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="flex items-center space-x-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${
                    step === s.num
                      ? 'bg-blue-600 text-white'
                      : step > s.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span className={`text-xs font-semibold hidden md:inline ${
                    step === s.num ? 'text-slate-800' : 'text-slate-400'
                  }`}>{s.label}</span>
                  {s.num < 6 && <div className="hidden md:block w-8 h-px bg-slate-200"></div>}
                </div>
              );
            })}
          </div>
        )}

        {/* Success Screen */}
        {onboardResult && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center space-y-6">
            <div className="flex items-center justify-center w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Employee Onboarded Successfully!</h3>
              <p className="text-sm text-slate-500 mt-1">Worker record digitized and credentials created.</p>
            </div>
            
            <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-lg p-5 text-left space-y-3">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-medium text-slate-500">Employee Code / ID:</span>
                <span className="text-sm font-bold text-blue-600">{onboardResult.employeeCode}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-medium text-slate-500">Default Password:</span>
                <span className="text-sm font-mono font-bold text-slate-800">{onboardResult.defaultPassword}</span>
              </div>
            </div>

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => {
                  setOnboardResult(null);
                  setStep(1);
                  setPersonal({
                    fullName: '', age: '', dob: '', nationality: 'Indian', gender: 'Male', religion: '',
                    phoneNumber: '', email: '', presentAddress: '', permanentAddress: '',
                    aadharNumber: '', pfNumber: '', esicNumber: '', joiningDate: '', designationId: designations[0]?.id || ''
                  });
                  setFamily([]);
                  setEducation([]);
                  setHistory([]);
                  setSalary({ fixedGross: '', teaAllowance: '500', basicPercentage: '40', hraPercentage: '30', conveyancePercentage: '30' });
                  setDocuments({ PHOTO: null, AADHAAR: null, PAN: null, PASSBOOK: null, JOINING_FORM: null, PF: null, ESIC: null });
                }}
                className="dashboard-btn-secondary"
              >
                Onboard Another
              </button>
              <button onClick={() => router.push('/employees')} className="dashboard-btn-primary">
                Go to Employee List
              </button>
            </div>
          </div>
        )}

        {/* Wizard Form Sheets */}
        {!onboardResult && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={personal.fullName}
                      onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                      className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                    />
                    {formErrors.fullName && <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Age *</label>
                    <input
                      type="number"
                      value={personal.age}
                      onChange={(e) => setPersonal({ ...personal, age: e.target.value })}
                      className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                    />
                    {formErrors.age && <p className="text-red-500 text-xs mt-1">{formErrors.age}</p>}
                  </div>
 
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth *</label>
                     <input
                       type="date"
                       value={personal.dob}
                       onChange={(e) => setPersonal({ ...personal, dob: e.target.value })}
                       className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                     />
                     {formErrors.dob && <p className="text-red-500 text-xs mt-1">{formErrors.dob}</p>}
                   </div>
 
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 mb-1">Designation *</label>
                     <select
                       value={personal.designationId}
                       onChange={(e) => setPersonal({ ...personal, designationId: e.target.value })}
                       className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                     >
                       {designations.map((d) => (
                         <option key={d.id} value={d.id}>{d.name}</option>
                       ))}
                     </select>
                     {formErrors.designationId && <p className="text-red-500 text-xs mt-1">{formErrors.designationId}</p>}
                   </div>
 
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 mb-1">Gender *</label>
                     <select
                       value={personal.gender}
                       onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}
                       className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                     >
                       <option>Male</option>
                       <option>Female</option>
                       <option>Other</option>
                     </select>
                     {formErrors.gender && <p className="text-red-500 text-xs mt-1">{formErrors.gender}</p>}
                   </div>
 
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 mb-1">Nationality *</label>
                     <input
                       type="text"
                       value={personal.nationality}
                       onChange={(e) => setPersonal({ ...personal, nationality: e.target.value })}
                       className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                     />
                     {formErrors.nationality && <p className="text-red-500 text-xs mt-1">{formErrors.nationality}</p>}
                   </div>
 
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 mb-1">Religion *</label>
                     <input
                       type="text"
                       value={personal.religion}
                       onChange={(e) => setPersonal({ ...personal, religion: e.target.value })}
                       className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                     />
                     {formErrors.religion && <p className="text-red-500 text-xs mt-1">{formErrors.religion}</p>}
                   </div>
 
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number (Optional)</label>
                     <input
                       type="text"
                       value={personal.phoneNumber}
                       onChange={(e) => setPersonal({ ...personal, phoneNumber: e.target.value })}
                       className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                     />
                     {formErrors.phoneNumber && <p className="text-red-500 text-xs mt-1">{formErrors.phoneNumber}</p>}
                   </div>
 
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 mb-1">Email (Optional)</label>
                     <input
                       type="email"
                       value={personal.email}
                       onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                       className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                     />
                     {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                   </div>
 
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 mb-1">Joining Date *</label>
                     <input
                       type="date"
                       value={personal.joiningDate}
                       onChange={(e) => setPersonal({ ...personal, joiningDate: e.target.value })}
                       className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                     />
                     {formErrors.joiningDate && <p className="text-red-500 text-xs mt-1">{formErrors.joiningDate}</p>}
                   </div>
 
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 mb-1">Aadhaar Card Number *</label>
                     <input
                       type="text"
                       value={personal.aadharNumber}
                       onChange={(e) => setPersonal({ ...personal, aadharNumber: e.target.value })}
                       className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                     />
                     {formErrors.aadharNumber && <p className="text-red-500 text-xs mt-1">{formErrors.aadharNumber}</p>}
                   </div>
 
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 mb-1">PF Account Number *</label>
                     <input
                       type="text"
                       value={personal.pfNumber}
                       onChange={(e) => setPersonal({ ...personal, pfNumber: e.target.value })}
                       className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                     />
                     {formErrors.pfNumber && <p className="text-red-500 text-xs mt-1">{formErrors.pfNumber}</p>}
                   </div>
 
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 mb-1">ESIC Insurance Number *</label>
                     <input
                       type="text"
                       value={personal.esicNumber}
                       onChange={(e) => setPersonal({ ...personal, esicNumber: e.target.value })}
                       className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                     />
                     {formErrors.esicNumber && <p className="text-red-500 text-xs mt-1">{formErrors.esicNumber}</p>}
                   </div>
                 </div>
 
                 <div className="grid grid-cols-1 gap-4 mt-4">
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 mb-1">Present Address (Optional)</label>
                     <textarea
                       rows={2}
                       value={personal.presentAddress}
                       onChange={(e) => setPersonal({ ...personal, presentAddress: e.target.value })}
                       className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                     />
                     {formErrors.presentAddress && <p className="text-red-500 text-xs mt-1">{formErrors.presentAddress}</p>}
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 mb-1">Permanent Address (Optional)</label>
                     <textarea
                       rows={2}
                       value={personal.permanentAddress}
                       onChange={(e) => setPersonal({ ...personal, permanentAddress: e.target.value })}
                       className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                     />
                     {formErrors.permanentAddress && <p className="text-red-500 text-xs mt-1">{formErrors.permanentAddress}</p>}
                   </div>
                 </div>
               </div>
            )}

            {/* Step 2: Family Info */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-base font-bold text-slate-800">Family Members</h3>
                  <button onClick={addFamilyMember} className="dashboard-btn-secondary py-1 text-xs">
                    + Add Member
                  </button>
                </div>

                {family.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No family members registered. Click Add to log dependents.</p>
                ) : (
                  <div className="space-y-4">
                    {family.map((fam, idx) => (
                      <div key={idx} className="border border-slate-200 rounded p-4 relative bg-slate-50 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <button
                          onClick={() => removeFamilyMember(idx)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Relationship</label>
                          <select
                            value={fam.relationship}
                            onChange={(e) => updateFamilyMember(idx, 'relationship', e.target.value)}
                            className="block w-full border border-slate-200 rounded px-2 py-1.5 text-xs bg-white focus:outline-none"
                          >
                            <option>FATHER</option>
                            <option>MOTHER</option>
                            <option>SPOUSE</option>
                            <option>CHILD</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={fam.fullName}
                            onChange={(e) => updateFamilyMember(idx, 'fullName', e.target.value)}
                            className="block w-full border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Occupation</label>
                          <input
                            type="text"
                            value={fam.occupation}
                            onChange={(e) => updateFamilyMember(idx, 'occupation', e.target.value)}
                            className="block w-full border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Number</label>
                          <input
                            type="text"
                            value={fam.contactNumber}
                            onChange={(e) => updateFamilyMember(idx, 'contactNumber', e.target.value)}
                            className="block w-full border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Education */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-base font-bold text-slate-800">Education Information</h3>
                  <button onClick={addEducation} className="dashboard-btn-secondary py-1 text-xs">
                    + Add Record
                  </button>
                </div>

                {education.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No qualification records added. Click Add to log degrees.</p>
                ) : (
                  <div className="space-y-4">
                    {education.map((edu, idx) => (
                      <div key={idx} className="border border-slate-200 rounded p-4 relative bg-slate-50 grid grid-cols-1 md:grid-cols-6 gap-3">
                        <button
                          onClick={() => removeEducation(idx)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Qualification</label>
                          <input
                            type="text"
                            value={edu.qualification}
                            placeholder="e.g. B.Tech / SSC"
                            onChange={(e) => updateEducation(idx, 'qualification', e.target.value)}
                            className="block w-full border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:outline-none"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Institution</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                            className="block w-full border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Score</label>
                          <input
                            type="text"
                            value={edu.score}
                            onChange={(e) => updateEducation(idx, 'score', e.target.value)}
                            className="block w-full border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                          <select
                            value={edu.scoreType}
                            onChange={(e) => updateEducation(idx, 'scoreType', e.target.value)}
                            className="block w-full border border-slate-200 rounded px-2 py-1.5 text-xs bg-white focus:outline-none"
                          >
                            <option>PERCENTAGE</option>
                            <option>GPA</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Employment History */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-base font-bold text-slate-800">Employment History</h3>
                  <button onClick={addHistory} className="dashboard-btn-secondary py-1 text-xs">
                    + Add Experience
                  </button>
                </div>

                {history.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No previous employment logs added. Click Add to log experience.</p>
                ) : (
                  <div className="space-y-4">
                    {history.map((hist, idx) => (
                      <div key={idx} className="border border-slate-200 rounded p-4 relative bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                          onClick={() => removeHistory(idx)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Employer Name</label>
                          <input
                            type="text"
                            value={hist.employerName}
                            onChange={(e) => updateHistory(idx, 'employerName', e.target.value)}
                            className="block w-full border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Designation</label>
                          <input
                            type="text"
                            value={hist.designation}
                            onChange={(e) => updateHistory(idx, 'designation', e.target.value)}
                            className="block w-full border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Experience Years</label>
                          <input
                            type="number"
                            step="0.1"
                            value={hist.experienceYears}
                            onChange={(e) => updateHistory(idx, 'experienceYears', e.target.value)}
                            className="block w-full border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Salary */}
            {step === 5 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">Salary Structure Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fixed Gross Salary (Monthly) *</label>
                    <input
                      type="number"
                      value={salary.fixedGross}
                      onChange={(e) => setSalary({ ...salary, fixedGross: e.target.value })}
                      placeholder="e.g. 25000"
                      className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                    />
                    {formErrors.fixedGross && <p className="text-red-500 text-xs mt-1">{formErrors.fixedGross}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fixed Tea Allowance (Monthly)</label>
                    <input
                      type="number"
                      value={salary.teaAllowance}
                      onChange={(e) => setSalary({ ...salary, teaAllowance: e.target.value })}
                      className="block w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Components Percentage Breakup</h4>
                    <span className="text-xs text-slate-400 font-medium">Must equal 100% total</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Basic %</label>
                      <input
                        type="number"
                        value={salary.basicPercentage}
                        onChange={(e) => setSalary({ ...salary, basicPercentage: e.target.value })}
                        className="block w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-center focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">HRA %</label>
                      <input
                        type="number"
                        value={salary.hraPercentage}
                        onChange={(e) => setSalary({ ...salary, hraPercentage: e.target.value })}
                        className="block w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-center focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Conveyance %</label>
                      <input
                        type="number"
                        value={salary.conveyancePercentage}
                        onChange={(e) => setSalary({ ...salary, conveyancePercentage: e.target.value })}
                        className="block w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-center focus:outline-none"
                      />
                    </div>
                  </div>

                  {formErrors.percentages && (
                    <p className="text-red-500 text-xs mt-1 text-center font-medium">{formErrors.percentages}</p>
                  )}

                  {/* Calculations Preview info */}
                  {salary.fixedGross && (
                    <div className="border-t border-slate-200 pt-3 text-xs space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span>Remaining Gross (Fixed Gross - Tea Allowance):</span>
                        <span className="font-bold text-slate-800">Rs. {salary.fixedGross - salary.teaAllowance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Calculated Fixed Basic:</span>
                        <span>Rs. {Math.round((salary.fixedGross - salary.teaAllowance) * (salary.basicPercentage / 100))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Calculated Fixed HRA:</span>
                        <span>Rs. {Math.round((salary.fixedGross - salary.teaAllowance) * (salary.hraPercentage / 100))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Calculated Fixed Conveyance:</span>
                        <span>Rs. {Math.round((salary.fixedGross - salary.teaAllowance) * (salary.conveyancePercentage / 100))}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Document Upload */}
            {step === 6 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">Document Attachments</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { type: 'PHOTO', label: 'Employee Photograph' },
                    { type: 'AADHAAR', label: 'Aadhaar Card copy' },
                    { type: 'PAN', label: 'PAN Card copy' },
                    { type: 'PASSBOOK', label: 'Bank Passbook copy' },
                    { type: 'JOINING_FORM', label: 'Onboarding Joining Form' },
                    { type: 'PF', label: 'PF Registration Document' },
                    { type: 'ESIC', label: 'ESIC Insurance Document' },
                  ].map((doc) => (
                    <div key={doc.type} className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{doc.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px] truncate">
                          {documents[doc.type]?.fileName || 'No file selected'}
                        </p>
                      </div>
                      
                      <div className="relative overflow-hidden shrink-0">
                        <button className="dashboard-btn-secondary text-xs py-1.5 flex items-center">
                          <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload File
                        </button>
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(doc.type, e)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {formErrors.submit && (
                  <p className="text-red-500 text-xs mt-3 font-semibold text-center">{formErrors.submit}</p>
                )}
              </div>
            )}

            {/* Bottom Actions Nav buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 1 || loading}
                className="dashboard-btn-secondary flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </button>

              {step < 6 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="dashboard-btn-primary flex items-center"
                >
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={loading}
                  className="dashboard-btn-primary flex items-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>Finish Onboarding <CheckCircle2 className="w-4 h-4 ml-2" /></>
                  )}
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </AdminLayout>
  );
}
