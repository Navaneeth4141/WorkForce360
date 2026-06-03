import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';

// Import Controller functions
import { login, logout, changePassword, resetPassword } from '../controllers/authController.js';
import { createEmployee, getEmployees, getEmployeeById, updateEmployee, deactivateEmployee, getMyProfile, getMyAttendance, getMyPayroll } from '../controllers/employeeController.js';
import { saveAttendance, getAttendance, getMonthlyAttendanceSummary } from '../controllers/attendanceController.js';
import { generatePayroll, freezePayroll, getPayrollHistory, getPayrollBatchDetails } from '../controllers/payrollController.js';
import { createClient, getClients, updateClient, deactivateClient, createContract, getContracts, updateContractStatus } from '../controllers/clientController.js';
import { generateInvoice, freezeInvoice, getInvoices, getInvoiceById } from '../controllers/invoiceController.js';
import { createExpense, getExpenses, getExpenseCategories, createExpenseCategory } from '../controllers/expenseController.js';
import { getPayrollReport, getAttendanceReport, getRevenueReport, getProfitReport } from '../controllers/reportsController.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const router = express.Router();

// ==========================================
// 1. Authentication APIs
// ==========================================
router.post('/auth/login', login);
router.post('/auth/logout', authenticateToken, logout);
router.post('/auth/change-password', authenticateToken, changePassword);
router.post('/auth/reset-password', authenticateToken, requireRole(['ADMIN']), resetPassword);

// ==========================================
// 2. Employee Management APIs
// ==========================================
// Self-Service Routes (Placed first to avoid route clash with :id)
router.get('/employees/profile/me', authenticateToken, getMyProfile);
router.get('/employees/attendance/me', authenticateToken, getMyAttendance);
router.get('/employees/payroll/me', authenticateToken, getMyPayroll);

router.post('/employees', authenticateToken, requireRole(['ADMIN']), createEmployee);
router.get('/employees', authenticateToken, getEmployees);
router.get('/employees/:id', authenticateToken, getEmployeeById);
router.put('/employees/:id', authenticateToken, requireRole(['ADMIN']), updateEmployee);
router.delete('/employees/:id', authenticateToken, requireRole(['ADMIN']), deactivateEmployee);

// Designations Helper Endpoint
router.get('/designations', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.designation.findMany({ where: { isActive: true } });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch designations' } });
  }
});

// ==========================================
// 3. Attendance APIs
// ==========================================
router.post('/attendance', authenticateToken, requireRole(['ADMIN']), saveAttendance);
router.get('/attendance', authenticateToken, getAttendance);
router.get('/attendance/monthly', authenticateToken, getMonthlyAttendanceSummary);

// ==========================================
// 4. Payroll APIs
// ==========================================
router.post('/payroll/generate', authenticateToken, requireRole(['ADMIN']), generatePayroll);
router.post('/payroll/freeze', authenticateToken, requireRole(['ADMIN']), freezePayroll);
router.get('/payroll/history', authenticateToken, getPayrollHistory);
router.get('/payroll/:id', authenticateToken, getPayrollBatchDetails);

// ==========================================
// 5. Client & Contract APIs
// ==========================================
router.post('/clients', authenticateToken, requireRole(['ADMIN']), createClient);
router.get('/clients', authenticateToken, getClients);
router.put('/clients/:id', authenticateToken, requireRole(['ADMIN']), updateClient);
router.delete('/clients/:id', authenticateToken, requireRole(['ADMIN']), deactivateClient);

router.post('/contracts', authenticateToken, requireRole(['ADMIN']), createContract);
router.get('/contracts', authenticateToken, getContracts);
router.put('/contracts/:id/status', authenticateToken, requireRole(['ADMIN']), updateContractStatus);

// ==========================================
// 6. Invoice APIs
// ==========================================
router.post('/invoices/generate', authenticateToken, requireRole(['ADMIN']), generateInvoice);
router.post('/invoices/freeze', authenticateToken, requireRole(['ADMIN']), freezeInvoice);
router.get('/invoices', authenticateToken, getInvoices);
router.get('/invoices/:id', authenticateToken, getInvoiceById);

// ==========================================
// 7. Expense APIs
// ==========================================
router.post('/expenses', authenticateToken, requireRole(['ADMIN']), createExpense);
router.get('/expenses', authenticateToken, getExpenses);
router.get('/expenses/categories', authenticateToken, getExpenseCategories);
router.post('/expenses/categories', authenticateToken, requireRole(['ADMIN']), createExpenseCategory);

// ==========================================
// 8. Reports & Analytics APIs (Admin Only)
// ==========================================
router.get('/reports/payroll', authenticateToken, requireRole(['ADMIN']), getPayrollReport);
router.get('/reports/attendance', authenticateToken, requireRole(['ADMIN']), getAttendanceReport);
router.get('/reports/revenue', authenticateToken, requireRole(['ADMIN']), getRevenueReport);
router.get('/reports/profit', authenticateToken, requireRole(['ADMIN']), getProfitReport);

// ==========================================
// 9. Settings APIs
// ==========================================
router.get('/settings', authenticateToken, getSettings);
router.put('/settings', authenticateToken, requireRole(['ADMIN']), updateSettings);

export default router;
