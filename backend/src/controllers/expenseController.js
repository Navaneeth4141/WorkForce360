import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/expenses
 * Create a new expense entry
 */
export async function createExpense(req, res) {
  const { categoryId, expenseName, amount, expenseDate, description } = req.body;

  if (!categoryId || !expenseName || !amount || !expenseDate) {
    return res.status(400).json({ error: { message: 'Category, Expense Name, Amount, and Date are required' } });
  }

  try {
    // Verify category exists
    const category = await prisma.expenseCategory.findFirst({
      where: { id: categoryId, isActive: true },
    });

    if (!category) {
      return res.status(404).json({ error: { message: 'Expense category not found' } });
    }

    const expense = await prisma.expense.create({
      data: {
        categoryId,
        expenseName,
        amount: parseFloat(amount),
        expenseDate: new Date(expenseDate),
        description: description || null,
        createdBy: req.user.id,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'Expense Created',
        entityType: 'Expense',
        entityId: expense.id,
        description: `Logged expense "${expenseName}" under category "${category.name}" for Rs. ${amount}`,
      },
    });

    return res.status(201).json({ message: 'Expense logged successfully', expense });
  } catch (error) {
    console.error('Create expense error:', error);
    return res.status(500).json({ error: { message: 'Internal server error logging expense' } });
  }
}

/**
 * GET /api/expenses
 * List all logged expenses with filters
 */
export async function getExpenses(req, res) {
  const { categoryId, startDate, endDate, search } = req.query;

  const where = {};

  if (categoryId) {
    where.categoryId = String(categoryId);
  }

  if (startDate || endDate) {
    where.expenseDate = {};
    if (startDate) where.expenseDate.gte = new Date(startDate);
    if (endDate) where.expenseDate.lte = new Date(endDate);
  }

  if (search) {
    where.OR = [
      { expenseName: { contains: String(search) } },
      { description: { contains: String(search) } },
    ];
  }

  try {
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: { expenseDate: 'desc' },
    });

    return res.json(expenses);
  } catch (error) {
    console.error('Fetch expenses error:', error);
    return res.status(500).json({ error: { message: 'Internal server error fetching expenses' } });
  }
}

/**
 * GET /api/expenses/categories
 * List all active expense categories
 */
export async function getExpenseCategories(req, res) {
  try {
    const categories = await prisma.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return res.json(categories);
  } catch (error) {
    console.error('Fetch categories error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

/**
 * POST /api/expenses/categories
 * Create a new expense category
 */
export async function createExpenseCategory(req, res) {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: { message: 'Category name is required' } });
  }

  try {
    const existing = await prisma.expenseCategory.findFirst({
      where: { name: String(name).trim(), isActive: true },
    });

    if (existing) {
      return res.status(400).json({ error: { message: 'Expense category already exists' } });
    }

    const category = await prisma.expenseCategory.create({
      data: {
        name: String(name).trim(),
        description: description || null,
        createdBy: req.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'Expense Category Created',
        entityType: 'ExpenseCategory',
        entityId: category.id,
        description: `Created expense category "${name}"`,
      },
    });

    return res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}
