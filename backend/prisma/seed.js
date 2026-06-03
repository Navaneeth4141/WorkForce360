import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed Expense Categories
  const categories = [
    { name: 'Transportation', description: 'Travel and transport expenses' },
    { name: 'Office Supplies', description: 'Stationery and supplies' },
    { name: 'Administrative', description: 'Office management and utility costs' },
    { name: 'Miscellaneous', description: 'Other unclassified expenses' },
  ];

  for (const cat of categories) {
    await prisma.expenseCategory.upsert({
      where: { id: cat.name }, // Dummy key mapping for SQLite upsert if needed, but since we don't have unique names in schema, we will findFirst or create
      update: {},
      create: cat,
    }).catch(async () => {
      // If schema maps unique names, we can check. Since schema doesn't have unique on category name, just create if not exists
      const existing = await prisma.expenseCategory.findFirst({ where: { name: cat.name } });
      if (!existing) {
        await prisma.expenseCategory.create({ data: cat });
      }
    });
  }
  console.log('Expense categories seeded.');

  // 2. Seed Designations
  const designations = [
    { name: 'Manager', description: 'Overall department or branch manager' },
    { name: 'Supervisor', description: 'Site or operations supervisor' },
    { name: 'Accountant', description: 'Finance and billing admin' },
    { name: 'Worker', description: 'Contract worker' },
  ];

  for (const des of designations) {
    const existing = await prisma.designation.findFirst({ where: { name: des.name } });
    if (!existing) {
      await prisma.designation.create({ data: des });
    }
  }
  console.log('Designations seeded.');

  // 3. Seed Default System Settings
  const defaultSlabs = [
    { maxGross: 15000, pt: 0 },
    { maxGross: 20000, pt: 150 },
    { maxGross: 9999999, pt: 200 }, // using 9999999 to represent no limit
  ];

  const existingSetting = await prisma.setting.findFirst();
  if (!existingSetting) {
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
    console.log('Default settings seeded.');
  }

  // 4. Seed Default Admin User
  const adminUsername = 'admin';
  const adminPassword = 'elitestaffing';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { employeeId: adminUsername },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        employeeId: adminUsername,
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log(`Default Admin seeded successfully: Username: ${adminUsername}, Password: ${adminPassword}`);
  } else {
    // Update password in case user changed it or wants it reset
    await prisma.user.update({
      where: { employeeId: adminUsername },
      data: { passwordHash: hashedPassword },
    });
    console.log(`Admin user already exists. Password reset to: ${adminPassword}`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
