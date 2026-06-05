'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext.js';
import { LogOut, User as UserIcon, Bell, Menu } from 'lucide-react';

export default function Navbar({ onMenuToggle, sidebarOpen }) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 z-30 flex items-center justify-between w-full h-16 px-6 border-b border-slate-200 bg-white shadow-sm">
      {/* Mobile menu toggle and title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuToggle}
          className="p-1 rounded-lg md:hidden text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
            Overview /
          </span>
          <h1 className="ml-1 text-lg font-bold text-slate-800">
            Console
          </h1>
        </div>
      </div>

      {/* User profile actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications Mock Icon */}
        <button className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 relative transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Vertical divider */}
        <div className="w-px h-6 bg-slate-200"></div>

        {/* User Identity and Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 transition-all duration-200"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold uppercase">
              {user?.employeeId ? user.employeeId.substring(0, 2) : 'AD'}
            </div>
            <span className="hidden md:inline text-sm font-medium text-slate-700">
              {user?.employeeId || 'Administrator'}
            </span>
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <>
              {/* Back Drop shadow layer */}
              <div
                onClick={() => setProfileOpen(false)}
                className="fixed inset-0 z-40"
              ></div>

              <div className="absolute right-0 z-50 w-56 mt-2 origin-top-right bg-white border border-slate-200 rounded-lg shadow-lg ring-1 ring-black/5 divide-y divide-slate-100">
                <div className="px-4 py-3">
                  <p className="text-xs text-slate-500">Logged in as</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{user?.employeeId || 'admin'}</p>
                  <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {user?.role || 'ADMIN'}
                  </span>
                </div>
                
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                  >
                    <UserIcon className="w-4 h-4 mr-3 shrink-0 text-slate-400" />
                    Company Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-slate-50"
                  >
                    <LogOut className="w-4 h-4 mr-3 shrink-0" />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
