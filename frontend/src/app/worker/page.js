'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import API from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  Download, 
  User as UserIcon, 
  ArrowRight,
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [profileRes, attendanceRes, payrollRes] = await Promise.all([
          API.get('/employees/profile/me'),
          API.get('/employees/attendance/me'),
          API.get('/employees/payroll/me')
        ]);
        setProfile(profileRes.data);
        setAttendance(attendanceRes.data);
        setPayroll(payrollRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard statistics. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate current month statistics
  const getStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthLogs = attendance.filter(log => {
      const date = new Date(log.attendanceDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const targetLogs = currentMonthLogs.length > 0 ? currentMonthLogs : attendance;
    const isCurrentMonth = currentMonthLogs.length > 0;

    const presentCount = targetLogs.filter(log => log.attendanceStatus === 'PRESENT').length;
    const halfDayCount = targetLogs.filter(log => log.attendanceStatus === 'HALF_DAY').length;
    const absentCount = targetLogs.filter(log => log.attendanceStatus === 'ABSENT').length;
    
    const totalOtHours = targetLogs.reduce((acc, log) => {
      return acc + parseFloat(log.overtimeHours || 0);
    }, 0);

    return {
      present: presentCount,
      halfDay: halfDayCount,
      absent: absentCount,
      otHours: totalOtHours,
      periodLabel: isCurrentMonth ? 'This Month' : 'All-time Record'
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const latestPayrollItem = payroll.length > 0 ? payroll[0] : null;
  const latestPayslip = latestPayrollItem?.payslips?.length > 0 ? latestPayrollItem.payslips[0] : null;

  // Format payroll month/year names
  const getMonthName = (monthNum) => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  const getPdfDownloadUrl = (relativeUrl) => {
    if (!relativeUrl) return '';
    const apiBase = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') 
      : 'http://localhost:5000';
    return `${apiBase}${relativeUrl}`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-8 translate-x-8"></div>
        <div className="relative z-10 space-y-2">
          <span className="bg-blue-500/30 text-blue-100 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Worker Portal
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {profile?.fullName || user?.employeeId}!
          </h1>
          <p className="text-blue-100 text-sm md:text-base max-w-md font-light">
            Here is your employment dashboard. View your attendance sheets, check historical payslips, and manage your credentials.
          </p>
          <div className="pt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs text-blue-200">
            <div>
              <span className="font-semibold text-white">Employee Code:</span> {profile?.employeeCode}
            </div>
            <div>
              <span className="font-semibold text-white">Designation:</span> {profile?.designation?.name || 'Worker'}
            </div>
            <div>
              <span className="font-semibold text-white">Joined:</span> {profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-50 text-red-700 p-4 border border-red-200 rounded-xl text-sm font-medium shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Present Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{stats.periodLabel} Present</span>
              <p className="text-2xl md:text-3xl font-extrabold text-emerald-600">{stats.present} Days</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-600/80 font-medium">Logged in attendance</div>
        </div>

        {/* Half Day Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{stats.periodLabel} Half-Day</span>
              <p className="text-2xl md:text-3xl font-extrabold text-amber-600">{stats.halfDay} Days</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-600/80 font-medium">Partial logs recorded</div>
        </div>

        {/* Absent Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{stats.periodLabel} Absent</span>
              <p className="text-2xl md:text-3xl font-extrabold text-red-600">{stats.absent} Days</p>
            </div>
            <div className="p-2 bg-red-50 rounded-xl text-red-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-red-600/80 font-medium">Missed working days</div>
        </div>

        {/* Overtime Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{stats.periodLabel} Overtime</span>
              <p className="text-2xl md:text-3xl font-extrabold text-blue-600">{stats.otHours} Hours</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-600/80 font-medium">Extra logged hours</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Payslip Summary */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-800">Latest Payslip</h3>
              </div>
              {latestPayslip && (
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full uppercase">
                  {getMonthName(latestPayrollItem.payrollBatch.payrollMonth)} {latestPayrollItem.payrollBatch.payrollYear}
                </span>
              )}
            </div>

            {latestPayrollItem ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Gross Pay</span>
                    <p className="text-lg font-bold text-slate-800">₹{parseFloat(latestPayrollItem.grossPay).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Deductions</span>
                    <p className="text-lg font-bold text-red-600">₹{(parseFloat(latestPayrollItem.pf) + parseFloat(latestPayrollItem.esic) + parseFloat(latestPayrollItem.professionalTax)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Net Take-Home</span>
                    <p className="text-lg font-extrabold text-blue-600">₹{parseFloat(latestPayrollItem.netSalary).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                  <div className="flex justify-between border-b border-slate-100 py-1.5">
                    <span>Payable Days:</span>
                    <span className="font-semibold text-slate-800">{latestPayrollItem.payableDays}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 py-1.5">
                    <span>Overtime Hours:</span>
                    <span className="font-semibold text-slate-800">{latestPayrollItem.overtimeHours} hrs</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 py-1.5">
                    <span>Earned Basic:</span>
                    <span className="font-semibold text-slate-800">₹{parseFloat(latestPayrollItem.earnedBasic).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 py-1.5">
                    <span>Earned HRA:</span>
                    <span className="font-semibold text-slate-800">₹{parseFloat(latestPayrollItem.earnedHra).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 space-y-2">
                <FileText className="w-12 h-12 stroke-[1.5]" />
                <p className="text-sm font-medium">No payroll data generated yet for your profile.</p>
                <p className="text-xs max-w-xs text-slate-400">Once your manager generates and releases payslips, your monthly breakdowns will appear here.</p>
              </div>
            )}
          </div>

          {latestPayrollItem && (
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">Subject to standard PF and professional tax deductions.</span>
              {latestPayslip ? (
                <a
                  href={getPdfDownloadUrl(latestPayslip.pdfUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-md transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
              ) : (
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  PDF Generating...
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick Links & Info */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-1">Quick Shortcuts</h3>
            
            <div className="space-y-2.5">
              <Link 
                href="/worker/profile" 
                className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-3 text-slate-700">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Personal Profile</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link 
                href="/worker/attendance" 
                className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-3 text-slate-700">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Attendance History</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link 
                href="/worker/payslips" 
                className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-3 text-slate-700">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Historical Payslips</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <span className="text-[11px] text-slate-400 font-medium">
              WorkForce360 Workforce Self-Service Portal
            </span>
          </div>
        </div>
      </div>

      {/* Recent Attendance Logs Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Recent Logs</h3>
        {attendance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50 rounded-lg">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Overtime Hours</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.slice(0, 5).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {new Date(log.attendanceDate).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        log.attendanceStatus === 'PRESENT' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : log.attendanceStatus === 'HALF_DAY' 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {log.attendanceStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {parseFloat(log.overtimeHours) > 0 ? `${log.overtimeHours} hrs` : '-'}
                    </td>
                    <td className="px-4 py-3 italic text-xs text-slate-400">
                      {log.remarks || 'None'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-sm">
            No attendance records found yet.
          </div>
        )}
      </div>
    </div>
  );
}
