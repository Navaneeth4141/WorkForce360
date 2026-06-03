'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext.js';
import { Eye, EyeOff, Lock, User as UserIcon } from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated, user, loading } = useAuth();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (user?.role === 'ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/worker');
      }
    }
  }, [isAuthenticated, user, loading, router]);

  // Check for expired session flag in URL
  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      setErrorMsg('Your session has expired. Please login again.');
    }
  }, [searchParams]);

  const validateForm = () => {
    const errors = {};
    if (!employeeId.trim()) {
      errors.employeeId = 'Employee ID is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    const result = await login(employeeId, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg p-8">
        
        {/* Branding Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl text-white font-bold text-xl mb-3 shadow-md">
            W360
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
          <p className="text-sm text-slate-500 mt-1">Sign in to manage your workforce portal</p>
        </div>

        {/* Error Callout */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Employee ID Field */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="employeeId">
              Employee ID / Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <UserIcon className="w-5 h-5" />
              </span>
              <input
                id="employeeId"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. admin or ESS001"
                className={`block w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  formErrors.employeeId ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'
                }`}
                disabled={isSubmitting}
              />
            </div>
            {formErrors.employeeId && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.employeeId}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={`block w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  formErrors.password ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'
                }`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formErrors.password && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.password}</p>
            )}
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-md shadow-blue-500/10 transition-colors duration-200 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
