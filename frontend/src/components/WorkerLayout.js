'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext.js';
import WorkerNavbar from './WorkerNavbar.js';

export default function WorkerLayout({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Route security check: redirect if not WORKER
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'WORKER') {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, loading, router]);

  // Handle loading state
  if (loading || !isAuthenticated || user?.role !== 'WORKER') {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500">Retrieving profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header and Bottom Nav + Desktop Sidebar */}
      <WorkerNavbar />

      {/* Main Content Area */}
      <div className="md:pl-64 min-h-screen flex flex-col">
        {/* On mobile, pad top for fixed header (14) and bottom for bottom nav (16) */}
        <main className="flex-1 p-4 pt-18 pb-20 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
