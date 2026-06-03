'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext.js';
import Sidebar from './Sidebar.js';
import Navbar from './Navbar.js';

export default function AdminLayout({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  // Route security check: redirect if not ADMIN
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'ADMIN') {
        router.push('/worker');
      }
    }
  }, [isAuthenticated, user, loading, router]);

  // Handle loading state
  if (loading || !isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500">Checking credentials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content wrapper */}
      <div
        className={`transition-all duration-300 min-h-screen flex flex-col ${
          sidebarOpen ? 'md:pl-64' : 'md:pl-20'
        }`}
      >
        {/* Top Header Navbar */}
        <Navbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        {/* Content Body Area */}
        <main className="flex-1 p-6 mt-16 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
