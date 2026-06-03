'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  Briefcase,
  FileSignature,
  DollarSign,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { name: 'Payroll', path: '/payroll', icon: CreditCard },
    { name: 'Payslips', path: '/payslips', icon: FileSpreadsheet },
    { name: 'Clients', path: '/clients', icon: Briefcase },
    { name: 'Invoices', path: '/invoices', icon: FileSignature },
    { name: 'Expenses', path: '/expenses', icon: DollarSign },
    { name: 'Reports', path: '/reports', icon: TrendingUp },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-slate-900 text-slate-100 border-r border-slate-800 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Header section with branding logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center space-x-3 overflow-hidden">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain rounded-lg shrink-0" />
          {isOpen && (
            <span className="text-sm font-bold tracking-wider text-white uppercase whitespace-nowrap">
              WorkForce360
            </span>
          )}
        </div>
        
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden md:flex items-center justify-center p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex flex-col h-[calc(100vh-4rem)] justify-between py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.path);

            return (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isOpen ? 'mr-3' : 'mx-auto'}`} />
                  {isOpen && <span className="text-sm whitespace-nowrap">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
        
        {/* Small copyright tag */}
        {isOpen && (
          <div className="px-6 text-xs text-slate-500 text-center">
            v1.0.0 © Elite Staffing
          </div>
        )}
      </nav>
    </aside>
  );
}
