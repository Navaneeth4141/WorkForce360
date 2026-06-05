import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * GET /api/settings
 * Retrieves company settings parameters
 */
export async function getSettings(req, res) {
  try {
    let settings = await prisma.setting.findFirst();
    
    // Fallback: seed default settings if missing
    if (!settings) {
      const defaultSlabs = [
        { maxGross: 15000, pt: 0 },
        { maxGross: 20000, pt: 150 },
        { maxGross: 9999999, pt: 200 },
      ];

      settings = await prisma.setting.create({
        data: {
          companyName: 'Elite Staffing Solutions',
          companyLogoUrl: '',
          address: '123 Business Hub, Tech City, 560001',
          phoneNumber: '+91 98765 43210',
          email: 'info@elitestaffing.com',
          gstNumber: '29AAAAA0000A1Z5',
          panNumber: 'AAAAA0000A',
          defaultPfPercentage: 12.0,
          defaultPfAdminPercentage: 1.0,
          defaultEsicPercentage: 3.25,
          professionalTaxSlabsJson: JSON.stringify(defaultSlabs),
          maximumOtHoursPerDay: 8.0,
        },
      });
    }

    // Parse slabs JSON for frontend ease of use
    const parsedSettings = {
      ...settings,
      professionalTaxSlabs: JSON.parse(settings.professionalTaxSlabsJson || '[]'),
    };
    delete parsedSettings.professionalTaxSlabsJson;

    return res.json(parsedSettings);
  } catch (error) {
    console.error('Fetch settings error:', error);
    return res.status(500).json({ error: { message: 'Internal server error fetching settings' } });
  }
}

/**
 * PUT /api/settings
 * Update settings details (Admin Only)
 */
export async function updateSettings(req, res) {
  const {
    companyName, companyLogoUrl, address, phoneNumber, email,
    gstNumber, panNumber, defaultPfPercentage, defaultPfAdminPercentage,
    defaultEsicPercentage, professionalTaxSlabs, maximumOtHoursPerDay
  } = req.body;

  if (!companyName) {
    return res.status(400).json({ error: { message: 'Company name is required' } });
  }

  try {
    let existing = await prisma.setting.findFirst();

    const updateData = {
      companyName,
      companyLogoUrl,
      address,
      phoneNumber,
      email,
      gstNumber,
      panNumber,
      defaultPfPercentage: defaultPfPercentage !== undefined ? parseFloat(defaultPfPercentage) : undefined,
      defaultPfAdminPercentage: defaultPfAdminPercentage !== undefined ? parseFloat(defaultPfAdminPercentage) : undefined,
      defaultEsicPercentage: defaultEsicPercentage !== undefined ? parseFloat(defaultEsicPercentage) : undefined,
      maximumOtHoursPerDay: maximumOtHoursPerDay !== undefined ? parseFloat(maximumOtHoursPerDay) : undefined,
      updatedBy: req.user.id,
    };

    if (professionalTaxSlabs && Array.isArray(professionalTaxSlabs)) {
      updateData.professionalTaxSlabsJson = JSON.stringify(professionalTaxSlabs);
    }

    let settings;
    if (existing) {
      settings = await prisma.setting.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      settings = await prisma.setting.create({
        data: {
          ...updateData,
          professionalTaxSlabsJson: JSON.stringify(professionalTaxSlabs || []),
        },
      });
    }

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'Settings Updated',
        entityType: 'Setting',
        entityId: settings.id,
        description: `Company settings and tax configuration updated by Admin`,
      },
    });

    const responseData = {
      ...settings,
      professionalTaxSlabs: JSON.parse(settings.professionalTaxSlabsJson || '[]'),
    };
    delete responseData.professionalTaxSlabsJson;

    return res.json({ message: 'Settings updated successfully', settings: responseData });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: { message: 'Internal server error updating settings' } });
  }
}

/**
 * POST /api/settings/reset-database
 * Completely truncates all tables and re-seeds default settings and default admin (Admin Only)
 */
export async function resetDatabase(req, res) {
  try {
    // Truncate all tables in cascade mode for PostgreSQL
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE 
        "user_sessions", 
        "employee_bank_details", 
        "employee_family_members", 
        "employee_education", 
        "employee_employment_history", 
        "employee_documents", 
        "salary_revisions", 
        "salary_structures", 
        "attendance", 
        "payslips", 
        "payroll_items", 
        "payroll_batches", 
        "invoice_items", 
        "invoice_batches", 
        "contracts", 
        "clients", 
        "expenses", 
        "expense_categories", 
        "employees", 
        "designations", 
        "settings", 
        "audit_logs",
        "users"
      CASCADE;
    `);

    // 1. Seed Expense Categories
    const categories = [
      { name: 'Transportation', description: 'Travel and transport expenses' },
      { name: 'Office Supplies', description: 'Stationery and supplies' },
      { name: 'Administrative', description: 'Office management and utility costs' },
      { name: 'Miscellaneous', description: 'Other unclassified expenses' },
    ];
    for (const cat of categories) {
      await prisma.expenseCategory.create({ data: cat });
    }

    // 2. Seed Designations
    const designations = [
      { name: 'Manager', description: 'Overall department or branch manager' },
      { name: 'Supervisor', description: 'Site or operations supervisor' },
      { name: 'Accountant', description: 'Finance and billing admin' },
      { name: 'Worker', description: 'Contract worker' },
    ];
    for (const des of designations) {
      await prisma.designation.create({ data: des });
    }

    // 3. Seed Default System Settings
    const defaultSlabs = [
      { maxGross: 15000, pt: 0 },
      { maxGross: 20000, pt: 150 },
      { maxGross: 9999999, pt: 200 },
    ];
    await prisma.setting.create({
      data: {
        companyName: 'Elite Staffing Solutions',
        companyLogoUrl: '',
        address: '123 Business Hub, Tech City, 560001',
        phoneNumber: '+91 98765 43210',
        email: 'info@elitestaffing.com',
        gstNumber: '29AAAAA0000A1Z5',
        panNumber: 'AAAAA0000A',
        defaultPfPercentage: 12.0,
        defaultPfAdminPercentage: 1.0,
        defaultEsicPercentage: 3.25,
        professionalTaxSlabsJson: JSON.stringify(defaultSlabs),
        maximumOtHoursPerDay: 8.0,
      },
    });

    // 4. Seed Default Admin User
    const adminUsername = 'admin';
    const adminPassword = 'elitestaffing';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        employeeId: adminUsername,
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    return res.json({ message: 'Database reset completed. Default admin account restored.' });
  } catch (error) {
    console.error('Reset database error:', error);
    return res.status(500).json({ error: { message: 'Failed to reset database.' } });
  }
}

