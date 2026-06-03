'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, FileText, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export default function WorkerNavbar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    { name: 'Home', path: '/worker', icon: Home },
    { name: 'Attendance', path: '/worker/attendance', icon: Calendar },
    { name: 'Payslips', path: '/worker/payslips', icon: FileText },
    { name: 'Profile', path: '/worker/profile', icon: User },
  ];

  return (
    <>
      {/* Top Header navbar for mobile worker portal */}
      <header className="fixed top-0 left-0 z-30 flex items-center justify-between w-full h-14 px-4 bg-slate-900 text-white shadow-md md:hidden">
        <div className="flex items-center space-x-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded" />
          <span className="text-sm font-bold tracking-wider uppercase">Worker Hub</span>
        </div>
        <button
          onClick={logout}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-red-400 transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Bottom navbar navigation (Required Mobile-First Layout) */}
      <nav className="fixed bottom-0 left-0 z-30 w-full h-16 bg-slate-900 border-t border-slate-800 text-slate-400 flex items-center justify-around md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-200 ${
                isActive ? 'text-blue-500 font-semibold' : 'hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Desktop sidebar navigation helper for workers (in case loaded on desktop) */}
      <aside className="fixed top-0 left-0 z-30 hidden md:flex flex-col justify-between w-64 h-screen bg-slate-900 border-r border-slate-800 text-slate-300">
        <div>
          <div className="flex items-center space-x-2 h-16 px-6 bg-slate-950 border-b border-slate-800">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain rounded" />
            <span className="text-sm font-bold tracking-wider text-white uppercase">Worker Portal</span>
          </div>
          <ul className="space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <li key={item.name}>
                  <Link
                    href={item.path}
                    className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3 shrink-0" />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex w-full items-center px-4 py-3 text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
