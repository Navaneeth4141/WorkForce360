'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout.js';
import API from '../../lib/api.js';
import {
  Users,
  CalendarCheck,
  CreditCard,
  FileSignature,
  ArrowUpRight,
  Plus,
  CheckSquare,
  FilePlus,
  Briefcase
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // KPI Metrics State
  const [metrics, setMetrics] = useState({
    totalWorkers: 0,
    activeWorkers: 0,
    presentToday: 0,
    absentToday: 0,
    payrollCost: 0,
    revenue: 0,
    expenses: 0,
    profit: 0,
  });

  // Chart Data State
  const [chartsData, setChartsData] = useState({
    attendanceTrends: [],
    financialTrends: [],
  });

  // Recent Activity State
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [recentPayroll, setRecentPayroll] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // Fetch basic employees count
        const empRes = await API.get('/employees?limit=5');
        const activeCount = empRes.data.meta.totalCount;

        // Fetch settings or settings slabs
        const settingsRes = await API.get('/settings');

        // Fetch payroll history
        const payrollRes = await API.get('/payroll/history');
        const recentRuns = payrollRes.data.slice(0, 3);

        // Fetch invoices history
        const invoiceRes = await API.get('/invoices');
        const recentBills = invoiceRes.data.slice(0, 3);

        // Fetch expenses history
        const expenseRes = await API.get('/expenses');

        // Fetch profit report to retrieve consolidated financials
        const profitRes = await API.get('/reports/profit');
        const financialSummary = profitRes.data;

        // Fetch attendance logs for today
        const todayStr = new Date().toISOString().split('T')[0];
        const attRes = await API.get(`/attendance?startDate=${todayStr}&endDate=${todayStr}`);
        const todayLogs = attRes.data;
        const presentCount = todayLogs.filter(a => a.attendanceStatus === 'PRESENT').length;
        const absentCount = todayLogs.filter(a => a.attendanceStatus === 'ABSENT').length;

        // Compute KPIs from database metrics without dummy mock fallbacks
        const totalW = activeCount || 0; 
        const activeW = activeCount || 0;
        const pToday = presentCount || 0;
        const aToday = absentCount || 0;
        
        const rev = financialSummary.revenueBilled || 0;
        const exp = financialSummary.generalExpenses || 0;
        const prf = financialSummary.netProfit || 0;
        const pay = (financialSummary.revenueBilled || 0) - (financialSummary.serviceChargesEarned || 0);
 
         setMetrics({
           totalWorkers: totalW,
           activeWorkers: activeW,
           presentToday: pToday,
           absentToday: aToday,
           payrollCost: pay,
           revenue: rev,
           expenses: exp,
           profit: prf,
         });
 
         // Set Recent lists (empty if no data in database)
         setRecentEmployees(empRes.data.employees || []);
 
         setRecentPayroll(recentRuns || []);
 
         setRecentInvoices(recentBills || []);
 
         // Charts default to empty lists when database is fresh
         setChartsData({
           attendanceTrends: [],
           financialTrends: [],
         });
 
       } catch (err) {
         console.error('Fetch dashboard details failed:', err);
         setError('Could not connect to the database. Dashboard metrics are initialized to zero.');
         
         // Set all counts to 0 in case of failure/no connection
         setMetrics({
           totalWorkers: 0,
           activeWorkers: 0,
           presentToday: 0,
           absentToday: 0,
           payrollCost: 0,
           revenue: 0,
           expenses: 0,
           profit: 0,
         });
 
         setChartsData({
           attendanceTrends: [],
           financialTrends: [],
         });
 
         setRecentEmployees([]);
         setRecentPayroll([]);
         setRecentInvoices([]);
       } finally {
         setLoading(false);
       }
    }

    fetchDashboardData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Banner Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 text-white rounded-xl p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold">Welcome to WorkForce360 Console</h2>
            <p className="text-sm text-slate-400 mt-1">Check today's roll, approve monthly payroll, and bill clients in real-time.</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3 shrink-0">
            <Link href="/employees" className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
              <Plus className="w-4 h-4 mr-2" /> Add Employee
            </Link>
            <Link href="/attendance" className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-slate-700 rounded-lg transition-colors">
              <CheckSquare className="w-4 h-4 mr-2" /> Daily Attendance
            </Link>
          </div>
        </div>

        {/* Database Warning Alert */}
        {error && (
          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded text-amber-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Row 1: KPI Cards (Attendance Counters) */}
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Operations & Attendance Today</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Total Workforce</p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-slate-800">{metrics.totalWorkers}</span>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Active Workers</p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-slate-800">{metrics.activeWorkers}</span>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Onboarded</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Present Today</p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-emerald-600">{metrics.presentToday}</span>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">On Duty</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Absent Today</p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-red-500">{metrics.absentToday}</span>
                <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Off Duty</span>
              </div>
            </div>

          </div>
        </div>

        {/* Row 2: Financial KPI Cards */}
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Financial Performance Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Total Revenue</p>
              <h4 className="text-xl font-black text-blue-700 mt-2">{formatCurrency(metrics.revenue)}</h4>
              <p className="text-[10px] text-slate-400 mt-1">Reimbursables + Service Fees</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Gross Payroll Cost</p>
              <h4 className="text-xl font-bold text-slate-800 mt-2">{formatCurrency(metrics.payrollCost)}</h4>
              <p className="text-[10px] text-slate-400 mt-1">Employee Wages</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Company Expenses</p>
              <h4 className="text-xl font-bold text-red-600 mt-2">{formatCurrency(metrics.expenses)}</h4>
              <p className="text-[10px] text-slate-400 mt-1">Manual office expenditures</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Net Profit</p>
              <h4 className="text-xl font-black text-emerald-600 mt-2">{formatCurrency(metrics.profit)}</h4>
              <p className="text-[10px] text-slate-400 mt-1">Service Fee - General Expenses</p>
            </div>

          </div>
        </div>

        {/* Row 3: Recharts Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Financial Performance Area Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-800">Revenue, Expenses & Profit Trends</h4>
              <span className="text-xs text-slate-400 font-medium">Monthly view</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartsData.financialTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPrf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} />
                  <YAxis stroke="#94A3B8" fontSize={10} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area type="monotone" name="Revenue" dataKey="revenue" stroke="#2563EB" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                  <Area type="monotone" name="Net Profit" dataKey="profit" stroke="#10B981" fillOpacity={1} fill="url(#colorPrf)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Attendance Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-800">Weekly Attendance Roll</h4>
              <span className="text-xs text-slate-400 font-medium">Daily count</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData.attendanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} />
                  <YAxis stroke="#94A3B8" fontSize={10} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar name="Present" dataKey="present" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar name="Absent" dataKey="absent" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Row 4: Recent Activities timelines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Employees */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 className="font-bold text-slate-800 text-sm">New Employees</h4>
              <Link href="/employees" className="text-xs text-blue-600 hover:underline font-semibold flex items-center">
                View All <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
            <ul className="space-y-3">
              {recentEmployees.map((emp) => (
                <li key={emp.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded bg-slate-100 text-slate-600 font-bold text-xs uppercase">
                      {emp.fullName.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{emp.fullName}</p>
                      <p className="text-xs text-slate-400">{emp.designation?.name || 'Worker'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {emp.employeeCode}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Payroll Runs */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 className="font-bold text-slate-800 text-sm">Recent Payroll Batches</h4>
              <Link href="/payroll" className="text-xs text-blue-600 hover:underline font-semibold flex items-center">
                View All <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
            <ul className="space-y-3">
              {recentPayroll.map((pay) => (
                <li key={pay.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-50 text-blue-600">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Batch for {getMonthName(pay.payrollMonth)} {pay.payrollYear}</p>
                      <p className="text-xs text-slate-400">Total gross: {formatCurrency(pay.totalPayrollCost)}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    pay.isFrozen ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {pay.isFrozen ? 'Frozen' : 'Draft'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 className="font-bold text-slate-800 text-sm">Recent Client Invoices</h4>
              <Link href="/invoices" className="text-xs text-blue-600 hover:underline font-semibold flex items-center">
                View All <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
            <ul className="space-y-3">
              {recentInvoices.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded bg-violet-50 text-violet-600">
                      <FileSignature className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{inv.invoiceNumber}</p>
                      <p className="text-xs text-slate-400">Total Billed: {formatCurrency(inv.totalInvoiceAmount)}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    inv.isFrozen ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {inv.isFrozen ? 'Billed' : 'Draft'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}

// Helper Month names mapping
function getMonthName(monthNumber) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1] || '';
}
