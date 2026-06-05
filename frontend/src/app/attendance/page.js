'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.js';
import API from '../../lib/api.js';
import { 
  Calendar, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Grid,
  FileSpreadsheet,
  Clock,
  UserCheck,
  UserX,
  Plus
} from 'lucide-react';

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'register'
  
  // ==========================================
  // 1. Daily Attendance State
  // ==========================================
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // employeeId -> { attendanceStatus, overtimeHours, remarks }
  const [maxOtLimit, setMaxOtLimit] = useState(8.0);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ==========================================
  // 2. Monthly Register State
  // ==========================================
  const now = new Date();
  const [regMonth, setRegMonth] = useState(now.getMonth() + 1); // 1-12
  const [regYear, setRegYear] = useState(now.getFullYear());
  const [monthLogs, setMonthLogs] = useState([]);
  const [regLoading, setRegLoading] = useState(false);

  const monthsList = [
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
    { val: 12, name: 'December' }
  ];

  const yearsList = [2024, 2025, 2026];

  // Fetch settings to read max overtime limit
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await API.get('/settings');
        setMaxOtLimit(parseFloat(res.data.maximumOtHoursPerDay) || 8.0);
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();
  }, []);

  // Fetch active employees and their attendance for the selected date (Daily)
  const loadAttendanceSheet = async () => {
    try {
      setLoading(true);
      setSuccessMsg('');
      setErrorMsg('');
      setIsLocked(false);

      // 1. Fetch active employees (limit 1000 to cover all active workers)
      const empRes = await API.get('/employees?status=ACTIVE&limit=1000');
      const activeEmps = empRes.data.employees;

      // Filter out employees who have not joined yet on this target selectedDate
      const normalizeDate = (dVal) => {
        const d = new Date(dVal);
        return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      };

      const targetDateUtc = normalizeDate(selectedDate);
      const filteredEmps = activeEmps.filter((emp) => {
        const joinDateUtc = normalizeDate(emp.joiningDate);
        return joinDateUtc <= targetDateUtc;
      });
      setEmployees(filteredEmps);

      // 2. Check if payroll is already frozen for the month of the selected date
      const dateObj = new Date(selectedDate);
      const month = dateObj.getMonth() + 1;
      const year = dateObj.getFullYear();
      
      const historyRes = await API.get(`/payroll/history?month=${month}&year=${year}`);
      const matchingBatch = historyRes.data?.[0];
      if (matchingBatch && matchingBatch.isFrozen) {
        setIsLocked(true);
        setErrorMsg(`Payroll for the month ${month}/${year} is frozen. All attendance logs are locked.`);
      }

      // 3. Fetch existing attendance logs for this date
      const logsRes = await API.get(`/attendance?startDate=${selectedDate}&endDate=${selectedDate}`);
      const logs = logsRes.data;

      // 4. Map logs to local state
      const initialRecords = {};
      filteredEmps.forEach((emp) => {
        const matchingLog = logs.find((l) => l.employeeId === emp.id);
        initialRecords[emp.id] = {
          attendanceStatus: matchingLog ? matchingLog.attendanceStatus : 'PRESENT',
          overtimeHours: matchingLog ? parseFloat(matchingLog.overtimeHours) : 0.0,
          remarks: matchingLog ? matchingLog.remarks || '' : '',
        };
      });
      setAttendanceRecords(initialRecords);

    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load attendance sheet details.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch registers logs (Monthly Register Matrix)
  const loadRegisterSheet = async () => {
    try {
      setRegLoading(true);
      setSuccessMsg('');
      setErrorMsg('');

      // 1. Fetch active employees if not fetched (limit 1000 to cover all active workers)
      const empRes = await API.get('/employees?status=ACTIVE&limit=1000');
      
      const lastDayOfRegMonth = new Date(regYear, regMonth, 0);
      const lastDayUtc = Date.UTC(lastDayOfRegMonth.getFullYear(), lastDayOfRegMonth.getMonth(), lastDayOfRegMonth.getDate());
      
      const filteredEmps = empRes.data.employees.filter((emp) => {
        const d = new Date(emp.joiningDate);
        const joinDateUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        return joinDateUtc <= lastDayUtc;
      });
      setEmployees(filteredEmps);

      // 2. Compute date bounds for the selected month
      const startStr = `${regYear}-${String(regMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(regYear, regMonth, 0).getDate();
      const endStr = `${regYear}-${String(regMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      // 3. Fetch attendance logs for the entire month
      const logsRes = await API.get(`/attendance?startDate=${startStr}&endDate=${endStr}`);
      setMonthLogs(logsRes.data);

    } catch (err) {
      console.error('Failed to load attendance register:', err);
      setErrorMsg('Failed to load monthly register details.');
    } finally {
      setRegLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'daily') {
      loadAttendanceSheet();
    } else {
      loadRegisterSheet();
    }
  }, [selectedDate, regMonth, regYear, activeTab]);

  const handleStatusChange = (empId, status) => {
    if (isLocked) return;
    setAttendanceRecords((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], attendanceStatus: status },
    }));
  };

  const handleOtChange = (empId, val) => {
    if (isLocked) return;
    const parsedVal = val === '' ? '' : parseFloat(val);
    setAttendanceRecords((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], overtimeHours: parsedVal },
    }));
  };

  const handleRemarksChange = (empId, val) => {
    if (isLocked) return;
    setAttendanceRecords((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], remarks: val },
    }));
  };

  // Submit attendance sheet
  const handleSaveAttendance = async () => {
    setSuccessMsg('');
    setErrorMsg('');

    // Client-side validations
    const recordsPayload = [];
    for (const emp of employees) {
      const rec = attendanceRecords[emp.id];
      const ot = parseFloat(rec.overtimeHours) || 0.0;

      // Overtime validation
      if (ot > 0) {
        if (ot % 0.5 !== 0) {
          setErrorMsg(`Validation error for ${emp.fullName}: Overtime hours must be in increments of 0.5 (e.g. 1.5, 2.0).`);
          return;
        }
        if (ot > maxOtLimit) {
          setErrorMsg(`Validation error for ${emp.fullName}: Overtime hours cannot exceed the maximum limit of ${maxOtLimit} hours.`);
          return;
        }
      }

      recordsPayload.push({
        employeeId: emp.id,
        attendanceStatus: rec.attendanceStatus,
        overtimeHours: ot,
        remarks: rec.remarks,
      });
    }

    try {
      setSaveLoading(true);
      await API.post('/attendance', {
        attendanceDate: selectedDate,
        records: recordsPayload,
      });
      setSuccessMsg('Attendance sheet saved successfully!');
      loadAttendanceSheet(); // reload state
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error?.message || 'Failed to save attendance records.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Helper values for monthly register days
  const getDaysArray = () => {
    const totalDays = new Date(regYear, regMonth, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  };

  // Helper to extract log from monthLogs by employee and day
  const getLogForDay = (empId, day) => {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(regMonth).padStart(2, '0');
    const targetDateStr = `${regYear}-${monthStr}-${dayStr}`;

    const match = monthLogs.find((l) => {
      const logDateStr = new Date(l.attendanceDate).toISOString().split('T')[0];
      return l.employeeId === empId && logDateStr === targetDateStr;
    });

    return match || null;
  };

  // Calculate monthly summary statistics for a worker
  const getWorkerSummary = (empId) => {
    const emp = employees.find(e => e.id === empId);
    const workerLogs = monthLogs.filter((l) => l.employeeId === empId);
    const present = workerLogs.filter((l) => l.attendanceStatus === 'PRESENT').length;
    const halfDay = workerLogs.filter((l) => l.attendanceStatus === 'HALF_DAY').length;
    
    let absent = workerLogs.filter((l) => l.attendanceStatus === 'ABSENT').length;
    
    if (emp) {
      const totalDays = new Date(regYear, regMonth, 0).getDate();
      for (let day = 1; day <= totalDays; day++) {
        const dayStr = String(day).padStart(2, '0');
        const monthStr = String(regMonth).padStart(2, '0');
        const currentDateStr = `${regYear}-${monthStr}-${dayStr}`;

        const normalizeDate = (dVal) => {
          const d = new Date(dVal);
          return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        };
        
        const isBeforeJoining = normalizeDate(currentDateStr) < normalizeDate(emp.joiningDate);
        if (isBeforeJoining) {
          absent += 1;
        }
      }
    }

    const ot = workerLogs.reduce((sum, l) => sum + parseFloat(l.overtimeHours || 0.0), 0.0);
    return { present, halfDay, absent, ot };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Title bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Attendance Center</h2>
            <p className="text-sm text-slate-500 mt-0.5">Manage daily clock-ins or browse the consolidated monthly attendance register.</p>
          </div>

          {/* Toggle Tab Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'daily'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Daily Sheet</span>
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Monthly Register</span>
            </button>
          </div>
        </div>

        {/* Filter controls based on active tab */}
        {activeTab === 'daily' ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600 flex items-center">
              <Calendar className="w-4 h-4 mr-1.5 text-slate-400" /> Target Work Date:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-200 rounded px-3 py-1.5 text-sm bg-white focus:outline-none"
            />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-slate-700">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold">Consolidated Matrix View</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="reg-month-select" className="text-xs font-bold text-slate-400 uppercase">Month</label>
                <select
                  id="reg-month-select"
                  value={regMonth}
                  onChange={(e) => setRegMonth(parseInt(e.target.value))}
                  className="border border-slate-200 rounded px-2 py-1.5 text-xs bg-slate-50 font-medium focus:outline-none"
                >
                  {monthsList.map(m => (
                    <option key={m.val} value={m.val}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label htmlFor="reg-year-select" className="text-xs font-bold text-slate-400 uppercase">Year</label>
                <select
                  id="reg-year-select"
                  value={regYear}
                  onChange={(e) => setRegYear(parseInt(e.target.value))}
                  className="border border-slate-200 rounded px-2 py-1.5 text-xs bg-slate-50 font-medium focus:outline-none"
                >
                  {yearsList.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Lock warning alert */}
        {activeTab === 'daily' && isLocked && (
          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded text-amber-800 text-xs font-semibold flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-amber-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded text-emerald-800 text-xs font-semibold flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && activeTab === 'daily' && !isLocked && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-800 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* TAB 1: Daily marking grid */}
        {activeTab === 'daily' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-200">
                      <th className="p-4">Employee Code</th>
                      <th className="p-4">Name</th>
                      <th className="p-4 text-center">Status (Present / Half Day / Absent)</th>
                      <th className="p-4">Overtime Hours</th>
                      <th className="p-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          Loading attendance sheet...
                        </td>
                      </tr>
                    ) : employees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 italic">No active employees found to log attendance.</td>
                      </tr>
                    ) : (
                      employees.map((emp) => {
                        const record = attendanceRecords[emp.id] || { attendanceStatus: 'PRESENT', overtimeHours: 0.0, remarks: '' };
                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/50">
                            <td className="p-4 font-semibold text-blue-600">{emp.employeeCode}</td>
                            <td className="p-4 font-medium text-slate-900">{emp.fullName}</td>
                            <td className="p-4">
                              <div className="flex items-center justify-center space-x-2">
                                {['PRESENT', 'HALF_DAY', 'ABSENT'].map((status) => (
                                  <button
                                    key={status}
                                    type="button"
                                    disabled={isLocked}
                                    onClick={() => handleStatusChange(emp.id, status)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                      record.attendanceStatus === status
                                        ? status === 'PRESENT'
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                          : status === 'HALF_DAY'
                                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                          : 'bg-red-100 text-red-800 border border-red-300'
                                        : 'bg-slate-100 text-slate-400 border border-transparent hover:bg-slate-200'
                                    }`}
                                  >
                                    {status.replace('_', ' ')}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max={maxOtLimit}
                                disabled={isLocked || record.attendanceStatus === 'ABSENT'}
                                value={record.attendanceStatus === 'ABSENT' ? '0' : record.overtimeHours}
                                onChange={(e) => handleOtChange(emp.id, e.target.value)}
                                placeholder="e.g. 1.5"
                                className="block w-24 border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none bg-slate-50 disabled:opacity-50"
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="text"
                                placeholder="Add remarks..."
                                disabled={isLocked}
                                value={record.remarks}
                                onChange={(e) => handleRemarksChange(emp.id, e.target.value)}
                                className="block w-full border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none bg-slate-50 disabled:opacity-50"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Save Button Actions bar */}
            {!isLocked && employees.length > 0 && (
              <div className="flex items-center justify-end">
                <button
                  onClick={handleSaveAttendance}
                  disabled={saveLoading}
                  className="dashboard-btn-primary flex items-center"
                >
                  {saveLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Save Attendance Sheet
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Monthly register matrix */}
        {activeTab === 'register' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                    <th className="p-3 sticky left-0 bg-slate-50 z-10 border-r border-slate-200 min-w-[100px]">Code</th>
                    <th className="p-3 sticky left-[100px] bg-slate-50 z-10 border-r border-slate-200 min-w-[160px]">Worker Name</th>
                    {getDaysArray().map((day) => (
                      <th key={day} className="p-1.5 text-center min-w-[32px] border-r border-slate-100">{day}</th>
                    ))}
                    <th className="p-3 text-center bg-slate-50/80 border-l border-slate-200 min-w-[60px]">P</th>
                    <th className="p-3 text-center bg-slate-50/80 min-w-[60px]">H</th>
                    <th className="p-3 text-center bg-slate-50/80 min-w-[60px]">A</th>
                    <th className="p-3 text-center bg-slate-50/80 min-w-[70px]">OT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {regLoading ? (
                    <tr>
                      <td colSpan={getDaysArray().length + 6} className="p-8 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Generating attendance matrix...
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={getDaysArray().length + 6} className="p-8 text-center text-slate-400 italic">No employees onboarded on register.</td>
                    </tr>
                  ) : (
                    employees.map((emp) => {
                      const summary = getWorkerSummary(emp.id);
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/50">
                          {/* Sticky columns */}
                          <td className="p-3 font-semibold text-blue-600 sticky left-0 bg-white border-r border-slate-200 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                            {emp.employeeCode}
                          </td>
                          <td className="p-3 font-medium text-slate-900 sticky left-[100px] bg-white border-r border-slate-200 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                            {emp.fullName}
                          </td>

                          {/* Matrix day columns */}
                          {getDaysArray().map((day) => {
                            const log = getLogForDay(emp.id, day);
                            const status = log ? log.attendanceStatus : null;
                            const ot = log ? parseFloat(log.overtimeHours) : 0.0;
                            const remarks = log ? log.remarks : '';

                            const dayStr = String(day).padStart(2, '0');
                            const monthStr = String(regMonth).padStart(2, '0');
                            const currentDateStr = `${regYear}-${monthStr}-${dayStr}`;

                            const normalizeDate = (dVal) => {
                              const d = new Date(dVal);
                              return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
                            };
                            
                            const isBeforeJoining = normalizeDate(currentDateStr) < normalizeDate(emp.joiningDate);

                            let badgeColor = 'bg-slate-100 text-slate-400 border border-transparent';
                            let char = '-';

                            if (isBeforeJoining) {
                              badgeColor = 'bg-red-50 text-red-700 border border-red-200';
                              char = 'A';
                            } else if (status === 'PRESENT') {
                              badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                              char = 'P';
                            } else if (status === 'HALF_DAY') {
                              badgeColor = 'bg-amber-50 text-amber-700 border border-amber-200';
                              char = 'H';
                            } else if (status === 'ABSENT') {
                              badgeColor = 'bg-red-50 text-red-700 border border-red-200';
                              char = 'A';
                            }

                            return (
                              <td 
                                key={day} 
                                className="p-1 text-center border-r border-slate-100"
                                title={isBeforeJoining ? 'Absent (Auto-marked: Before joining date)' : (log ? `Date: ${day}/${regMonth}, Status: ${status}${ot > 0 ? `, OT: +${ot} hrs` : ''}${remarks ? `, Note: ${remarks}` : ''}` : `No entry for day ${day}`)}
                              >
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-extrabold ${badgeColor}`}>
                                  {char}
                                </span>
                              </td>
                            );
                          })}

                          {/* Summary columns */}
                          <td className="p-3 text-center font-bold text-emerald-600 bg-slate-50/50 border-l border-slate-200 border-r border-slate-100">
                            {summary.present}
                          </td>
                          <td className="p-3 text-center font-bold text-amber-600 bg-slate-50/50 border-r border-slate-100">
                            {summary.halfDay}
                          </td>
                          <td className="p-3 text-center font-bold text-red-600 bg-slate-50/50 border-r border-slate-100">
                            {summary.absent}
                          </td>
                          <td className="p-3 text-center font-bold text-blue-600 bg-slate-50/50">
                            {summary.ot > 0 ? `+${summary.ot}` : '0'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Guide caption */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-1.5"></span> P = Present (1.0)</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full mr-1.5"></span> H = Half Day (0.5)</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 bg-red-500 rounded-full mr-1.5"></span> A = Absent (0.0)</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 bg-slate-300 rounded-full mr-1.5"></span> - = No record</span>
              </div>
              <span className="italic font-medium">Hover over status letters for details, remarks, and overtime hours.</span>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
