'use client';

import React, { useState, useEffect } from 'react';
import API from '../../../lib/api.js';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Search, 
  AlertCircle,
  Filter,
  CheckCircle,
  Info
} from 'lucide-react';

export default function WorkerAttendance() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering states
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');

  useEffect(() => {
    async function fetchAttendance() {
      try {
        setLoading(true);
        const res = await API.get('/employees/attendance/me');
        setLogs(res.data);
      } catch (err) {
        console.error('Error fetching attendance logs:', err);
        setError('Failed to fetch attendance history. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchAttendance();
  }, []);

  // Compute available months & years from logs for filtering
  const getFilterOptions = () => {
    const years = new Set();
    logs.forEach(log => {
      const year = new Date(log.attendanceDate).getFullYear();
      years.add(year);
    });

    const months = [
      { val: 1, name: 'January' },
      { val: 2, name: 'February' },
      { val: 3, name: 'March' },
      { val: 4, name: 'April' },
      { val: 5, name: 'May' },
      { val: 6, name: 'June' },
      { val: 7, name: 'July' },
      { val: 8, name: 'August' },
      { val: 9, name: 'September' },
      { val: 10, name: 'October' },
      { val: 11, name: 'November' },
      { val: 12, name: 'December' },
    ];

    return {
      years: Array.from(years).sort((a, b) => b - a),
      months
    };
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
      const date = new Date(log.attendanceDate);
      const matchMonth = selectedMonth === 'ALL' || (date.getMonth() + 1) === parseInt(selectedMonth);
      const matchYear = selectedYear === 'ALL' || date.getFullYear() === parseInt(selectedYear);
      return matchMonth && matchYear;
    });
  };

  const getSummaryStats = (filtered) => {
    const present = filtered.filter(log => log.attendanceStatus === 'PRESENT').length;
    const halfDay = filtered.filter(log => log.attendanceStatus === 'HALF_DAY').length;
    const absent = filtered.filter(log => log.attendanceStatus === 'ABSENT').length;
    
    const overtime = filtered.reduce((acc, log) => {
      return acc + parseFloat(log.overtimeHours || 0);
    }, 0);

    return { present, halfDay, absent, overtime };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500">Loading attendance history...</span>
        </div>
      </div>
    );
  }

  const { years, months } = getFilterOptions();
  const filteredLogs = getFilteredLogs();
  const stats = getSummaryStats(filteredLogs);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Attendance Ledger</h1>
        <p className="text-sm text-slate-500">Browse your daily check-in histories, statuses, and overtime credits.</p>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-50 text-red-700 p-4 border border-red-200 rounded-xl text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-slate-700">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold">Filter Attendance</span>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Month selector */}
          <div className="flex items-center space-x-2">
            <label htmlFor="month-select" className="text-xs font-semibold text-slate-400 uppercase">Month</label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Months</option>
              {months.map(m => (
                <option key={m.val} value={m.val}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Year selector */}
          <div className="flex items-center space-x-2">
            <label htmlFor="year-select" className="text-xs font-semibold text-slate-400 uppercase">Year</label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Years</option>
              {years.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Days Present</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2">{stats.present} Days</p>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Days Half-Day</span>
          <p className="text-2xl font-extrabold text-amber-700 mt-2">{stats.halfDay} Days</p>
        </div>

        <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Days Absent</span>
          <p className="text-2xl font-extrabold text-red-700 mt-2">{stats.absent} Days</p>
        </div>

        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Accumulated Overtime</span>
          <p className="text-2xl font-extrabold text-blue-700 mt-2">{stats.overtime} Hrs</p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Calendar Date</th>
                  <th className="px-6 py-4">Day</th>
                  <th className="px-6 py-4">Attendance Status</th>
                  <th className="px-6 py-4">Overtime Registered</th>
                  <th className="px-6 py-4">Manager Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const dateObj = new Date(log.attendanceDate);
                  const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'long' });
                  const displayDate = dateObj.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{displayDate}</td>
                      <td className="px-6 py-4 font-medium text-slate-500">{dayName}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          log.attendanceStatus === 'PRESENT' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : log.attendanceStatus === 'HALF_DAY' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                            : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {log.attendanceStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {parseFloat(log.overtimeHours) > 0 ? (
                          <span className="flex items-center space-x-1 text-blue-600 bg-blue-50/55 border border-blue-100 px-2 py-0.5 rounded-lg w-max text-xs">
                            <Clock className="w-3 h-3" />
                            <span>+{log.overtimeHours} hrs</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 italic text-xs text-slate-400">
                        {log.remarks || 'No notes added'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-3">
            <Calendar className="w-12 h-12 stroke-[1.5] text-slate-300 animate-pulse" />
            <p className="text-sm font-semibold">No attendance sheets matched your filter settings.</p>
            <p className="text-xs max-w-xs">Try selecting a different month/year range or verify with your payroll supervisor.</p>
          </div>
        )}
      </div>
    </div>
  );
}
