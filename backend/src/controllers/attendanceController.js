import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/attendance
 * Save or update daily attendance for a list of active employees
 */
export async function saveAttendance(req, res) {
  const { attendanceDate, records } = req.body; // records: Array of { employeeId, attendanceStatus, overtimeHours, remarks }

  if (!attendanceDate || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: { message: 'Attendance date and records array are required' } });
  }

  const dateObj = new Date(attendanceDate);
  if (isNaN(dateObj.getTime())) {
    return res.status(400).json({ error: { message: 'Invalid attendance date format' } });
  }

  const month = dateObj.getMonth() + 1; // 1-12
  const year = dateObj.getFullYear();

  try {
    // 1. Check if payroll is already generated and frozen for this month/year
    const frozenPayroll = await prisma.payrollBatch.findFirst({
      where: { payrollMonth: month, payrollYear: year, isFrozen: true },
    });

    if (frozenPayroll) {
      return res.status(400).json({
        error: { message: `Cannot modify attendance. Payroll for ${month}/${year} is already generated and frozen.` },
      });
    }

    // 2. Fetch system settings to validate max overtime limit
    const settings = await prisma.setting.findFirst() || { maximumOtHoursPerDay: 8.0 };
    const maxOtLimit = parseFloat(settings.maximumOtHoursPerDay);

    // 3. Process records and validate
    const validatedRecords = [];
    for (const rec of records) {
      const { employeeId, attendanceStatus, overtimeHours = 0.0, remarks } = rec;

      if (!employeeId || !attendanceStatus) {
        return res.status(400).json({ error: { message: 'Each record must contain employeeId and attendanceStatus' } });
      }

      // Allowed status values
      const validStatuses = ['PRESENT', 'HALF_DAY', 'ABSENT'];
      if (!validStatuses.includes(attendanceStatus)) {
        return res.status(400).json({ error: { message: `Invalid attendanceStatus: ${attendanceStatus}. Allowed: PRESENT, HALF_DAY, ABSENT` } });
      }

      const ot = parseFloat(overtimeHours) || 0.0;
      
      // Overtime validation (increments of 0.5 and <= maximum limit)
      if (ot < 0) {
        return res.status(400).json({ error: { message: `Overtime hours cannot be negative.` } });
      }
      if (ot > 0) {
        if (ot % 0.5 !== 0) {
          return res.status(400).json({ error: { message: `Overtime hours must be in increments of 0.5. Received: ${overtimeHours}` } });
        }
        if (ot > maxOtLimit) {
          return res.status(400).json({ error: { message: `Overtime hours (${ot}) exceed the daily maximum limit of ${maxOtLimit} hours.` } });
        }
      }

      validatedRecords.push({
        employeeId,
        attendanceDate: dateObj,
        attendanceStatus,
        overtimeHours: ot,
        remarks: remarks || null,
      });
    }

    // 4. Save to database in a transaction
    await prisma.$transaction(async (tx) => {
      for (const item of validatedRecords) {
        await tx.attendance.upsert({
          where: {
            employeeId_attendanceDate: {
              employeeId: item.employeeId,
              attendanceDate: item.attendanceDate,
            },
          },
          update: {
            attendanceStatus: item.attendanceStatus,
            overtimeHours: item.overtimeHours,
            remarks: item.remarks,
            updatedBy: req.user.id,
          },
          create: {
            employeeId: item.employeeId,
            attendanceDate: item.attendanceDate,
            attendanceStatus: item.attendanceStatus,
            overtimeHours: item.overtimeHours,
            remarks: item.remarks,
            createdBy: req.user.id,
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'Attendance Saved',
          entityType: 'Attendance',
          description: `Logged attendance for ${validatedRecords.length} workers on ${dateObj.toLocaleDateString()}`,
        },
      });
    });

    return res.json({ message: 'Attendance saved successfully' });
  } catch (error) {
    console.error('Save attendance error:', error);
    return res.status(500).json({ error: { message: 'Internal server error saving attendance' } });
  }
}

/**
 * GET /api/attendance
 * Retrieve attendance history logs with optional filters
 */
export async function getAttendance(req, res) {
  const { employeeId, startDate, endDate } = req.query;

  const where = {};

  if (employeeId) {
    where.employeeId = String(employeeId);
  }

  if (startDate || endDate) {
    where.attendanceDate = {};
    if (startDate) {
      where.attendanceDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.attendanceDate.lte = new Date(endDate);
    }
  }

  try {
    const logs = await prisma.attendance.findMany({
      where,
      include: {
        employee: { select: { employeeCode: true, fullName: true } },
      },
      orderBy: { attendanceDate: 'desc' },
    });

    return res.json(logs);
  } catch (error) {
    console.error('Fetch attendance error:', error);
    return res.status(500).json({ error: { message: 'Internal server error fetching logs' } });
  }
}

/**
 * GET /api/attendance/monthly
 * Helper summary utility: returns days present/half/absent and total OT hours for active employees
 */
export async function getMonthlyAttendanceSummary(req, res) {
  const { month, year, employeeId } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: { message: 'Month and Year parameters are required' } });
  }

  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  // Calculate first and last day of the month
  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0, 23, 59, 59);

  try {
    const where = {
      attendanceDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (employeeId) {
      where.employeeId = String(employeeId);
    }

    const records = await prisma.attendance.findMany({ where });

    // Aggregate records by employeeId
    const summaries = {};

    records.forEach((rec) => {
      const empId = rec.employeeId;
      if (!summaries[empId]) {
        summaries[empId] = {
          employeeId: empId,
          presentDays: 0,
          halfDays: 0,
          absentDays: 0,
          overtimeHours: 0.0,
        };
      }

      if (rec.attendanceStatus === 'PRESENT') {
        summaries[empId].presentDays += 1;
      } else if (rec.attendanceStatus === 'HALF_DAY') {
        summaries[empId].halfDays += 1;
      } else if (rec.attendanceStatus === 'ABSENT') {
        summaries[empId].absentDays += 1;
      }

      summaries[empId].overtimeHours += parseFloat(rec.overtimeHours) || 0.0;
    });

    return res.json(Object.values(summaries));
  } catch (error) {
    console.error('Fetch monthly summary error:', error);
    return res.status(500).json({ error: { message: 'Internal server error fetching summary' } });
  }
}
