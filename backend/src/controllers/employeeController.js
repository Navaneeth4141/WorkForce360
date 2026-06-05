import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/employees
 * Multi-step Onboarding Wizard controller - runs in a database transaction
 */
export async function createEmployee(req, res) {
  const {
    // Step 1: Personal Info
    fullName, age, dob, nationality, gender, religion, phoneNumber, email,
    presentAddress, permanentAddress, aadharNumber, pfNumber, esicNumber,
    joiningDate, designationId, status = 'ACTIVE',
    
    // Step 2: Bank Details
    bankDetails, // { bankName, accountHolderName, accountNumber, ifscCode, branchName }

    // Step 3: Family Members
    familyMembers, // Array of { relationship, fullName, occupation, dob, contactNumber }

    // Step 4: Education
    education, // Array of { qualification, institution, specialization, completionYear, score, scoreType }

    // Step 5: Employment History
    employmentHistory, // Array of { employerName, designation, experienceYears }

    // Step 6: Documents
    documents, // Array of { documentType, cloudinaryUrl }

    // Step 5 (Salary details)
    fixedGross,
    teaAllowance,
    basicPercentage,
    hraPercentage,
    conveyancePercentage,
  } = req.body;

  // Validation: Check required personal info
  if (!fullName || !designationId || !joiningDate) {
    return res.status(400).json({ error: { message: 'Missing required employee personal information' } });
  }

  // Validate salary percentages if provided
  if (fixedGross !== undefined && fixedGross !== null) {
    const totalPercentage = parseFloat(basicPercentage || 40) + parseFloat(hraPercentage || 30) + parseFloat(conveyancePercentage || 30);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return res.status(400).json({ error: { message: 'Salary structure percentages must sum up to exactly 100%' } });
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate next employee code: e.g. "ESS001", "ESS002"
      const lastEmployee = await tx.employee.findFirst({
        orderBy: { employeeCode: 'desc' },
      });

      let nextNumber = 1;
      if (lastEmployee && lastEmployee.employeeCode.startsWith('ESS')) {
        const currentNum = parseInt(lastEmployee.employeeCode.replace('ESS', ''), 10);
        if (!isNaN(currentNum)) {
          nextNumber = currentNum + 1;
        }
      }
      const employeeCode = `ESS${String(nextNumber).padStart(3, '0')}`;

      // 2. Create User account with dynamic default password (e.g. ESS001 -> ESS@001)
      const defaultPassword = employeeCode.startsWith('ESS') 
        ? employeeCode.replace('ESS', 'ESS@') 
        : `${employeeCode}@123`;
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const user = await tx.user.create({
        data: {
          employeeId: employeeCode,
          passwordHash: hashedPassword,
          role: 'WORKER',
          isActive: true,
          createdBy: req.user?.id || null,
        },
      });

      // 3. Calculate salary structures if provided
      let salaryStructuresCreate = undefined;
      if (fixedGross !== undefined && fixedGross !== null) {
        const gross = parseFloat(fixedGross);
        const tea = parseFloat(teaAllowance || 0);
        const basicPct = parseFloat(basicPercentage || 40);
        const hraPct = parseFloat(hraPercentage || 30);
        const convPct = parseFloat(conveyancePercentage || 30);

        const remainingGross = gross - tea;
        const fixedBasic = remainingGross * (basicPct / 100);
        const fixedHra = remainingGross * (hraPct / 100);
        const fixedConveyance = remainingGross * (convPct / 100);

        salaryStructuresCreate = {
          create: {
            fixedGross: gross,
            teaAllowance: tea,
            basicPercentage: basicPct,
            hraPercentage: hraPct,
            conveyancePercentage: convPct,
            fixedBasic,
            fixedHra,
            fixedConveyance,
            effectiveFrom: new Date(joiningDate),
            createdBy: req.user?.id || null,
          }
        };
      }

      // Create Employee Profile record
      const employee = await tx.employee.create({
        data: {
          employeeCode,
          fullName,
          age: parseInt(age, 10) || 0,
          dob: dob ? new Date(dob) : null,
          nationality,
          gender,
          religion,
          phoneNumber,
          email,
          presentAddress,
          permanentAddress,
          aadharNumber,
          pfNumber: pfNumber || null,
          esicNumber: esicNumber || null,
          joiningDate: new Date(joiningDate),
          designationId,
          status,
          isActive: true,
          createdBy: req.user?.id || null,
          
          // Connect nested 1-to-1 and 1-to-many records
          bankDetails: bankDetails ? {
            create: {
              bankName: bankDetails.bankName,
              accountHolderName: bankDetails.accountHolderName,
              accountNumber: bankDetails.accountNumber,
              ifscCode: bankDetails.ifscCode,
              branchName: bankDetails.branchName,
            }
          } : undefined,

          familyMembers: familyMembers && familyMembers.length > 0 ? {
            create: familyMembers.map(fam => ({
              relationship: fam.relationship,
              fullName: fam.fullName,
              occupation: fam.occupation || null,
              dob: fam.dob ? new Date(fam.dob) : null,
              contactNumber: fam.contactNumber || null,
            }))
          } : undefined,

          education: education && education.length > 0 ? {
            create: education.map(edu => ({
              qualification: edu.qualification,
              institution: edu.institution,
              specialization: edu.specialization || null,
              completionYear: parseInt(edu.completionYear, 10) || 0,
              score: parseFloat(edu.score) || 0.0,
              scoreType: edu.scoreType,
            }))
          } : undefined,

          employmentHistory: employmentHistory && employmentHistory.length > 0 ? {
            create: employmentHistory.map(hist => ({
              employerName: hist.employerName,
              designation: hist.designation,
              experienceYears: parseFloat(hist.experienceYears) || 0.0,
            }))
          } : undefined,

          documents: documents && documents.length > 0 ? {
            create: documents.map(doc => ({
              documentType: doc.documentType,
              cloudinaryUrl: doc.cloudinaryUrl,
            }))
          } : undefined,

          salaryStructures: salaryStructuresCreate,
        },
      });

      // Log action
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'Employee Onboarded',
          entityType: 'Employee',
          entityId: employee.id,
          description: `Onboarded employee ${fullName} with code ${employeeCode}`,
        },
      });

      return { employeeCode, defaultPassword, employeeId: employee.id };
    });

    return res.status(201).json({
      message: 'Employee onboarded successfully',
      employeeCode: result.employeeCode,
      defaultPassword: result.defaultPassword,
      employeeId: result.employeeId,
    });
  } catch (error) {
    console.error('Employee onboarding error:', error);
    return res.status(500).json({ error: { message: error.message || 'Internal server error during onboarding' } });
  }
}

/**
 * GET /api/employees
 * List all employees with pagination, search, and status filters
 */
export async function getEmployees(req, res) {
  const { search, designationId, status, page = 1, limit = 10 } = req.query;

  const parsedPage = parseInt(page, 10) || 1;
  const parsedLimit = parseInt(limit, 10) || 10;
  const skip = (parsedPage - 1) * parsedLimit;

  // Build query filter constraints
  const where = {
    isActive: true,
  };

  if (status) {
    where.status = String(status);
  }

  if (designationId) {
    where.designationId = String(designationId);
  }

  if (search) {
    where.OR = [
      { fullName: { contains: String(search) } },
      { employeeCode: { contains: String(search) } },
      { phoneNumber: { contains: String(search) } },
      { email: { contains: String(search) } },
    ];
  }

  try {
    const totalCount = await prisma.employee.count({ where });
    const employees = await prisma.employee.findMany({
      where,
      skip,
      take: parsedLimit,
      include: {
        designation: { select: { id: true, name: true } },
        salaryStructures: {
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
      orderBy: { employeeCode: 'asc' },
    });

    return res.json({
      employees,
      meta: {
        totalCount,
        currentPage: parsedPage,
        totalPages: Math.ceil(totalCount / parsedLimit),
        limit: parsedLimit,
      },
    });
  } catch (error) {
    console.error('Fetch employees error:', error);
    return res.status(500).json({ error: { message: 'Internal server error fetching employees' } });
  }
}

/**
 * GET /api/employees/:id
 * Retrieve full detail profile of employee (tabs integration)
 */
export async function getEmployeeById(req, res) {
  const { id } = req.params;

  try {
    const employee = await prisma.employee.findFirst({
      where: { id, isActive: true },
      include: {
        designation: true,
        bankDetails: true,
        familyMembers: true,
        education: true,
        employmentHistory: true,
        documents: true,
        salaryStructures: {
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ error: { message: 'Employee not found' } });
    }

    return res.json(employee);
  } catch (error) {
    console.error('Fetch employee by ID error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

/**
 * PUT /api/employees/:id
 * Update employee record
 */
export async function updateEmployee(req, res) {
  const { id } = req.params;
  const {
    fullName, age, dob, nationality, gender, religion, phoneNumber, email,
    presentAddress, permanentAddress, pfNumber, esicNumber,
    designationId, status, bankDetails,
    fixedGross, teaAllowance, basicPercentage, hraPercentage, conveyancePercentage,
  } = req.body;

  // Validate salary percentages if provided
  if (fixedGross !== undefined && fixedGross !== null) {
    const totalPercentage = parseFloat(basicPercentage || 40) + parseFloat(hraPercentage || 30) + parseFloat(conveyancePercentage || 30);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return res.status(400).json({ error: { message: 'Salary structure percentages must sum up to exactly 100%' } });
    }
  }

  try {
    const existing = await prisma.employee.findFirst({ where: { id, isActive: true } });
    if (!existing) {
      return res.status(404).json({ error: { message: 'Employee not found' } });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update personal details
      const emp = await tx.employee.update({
        where: { id },
        data: {
          fullName,
          age: age ? parseInt(age, 10) : undefined,
          dob: dob ? new Date(dob) : (dob === null || dob === '' ? null : undefined),
          nationality,
          gender,
          religion,
          phoneNumber,
          email,
          presentAddress,
          permanentAddress,
          pfNumber,
          esicNumber,
          designationId,
          status,
          updatedBy: req.user.id,
        },
      });

      // 2. Update bank details if provided
      if (bankDetails) {
        await tx.employeeBankDetails.upsert({
          where: { employeeId: id },
          update: {
            bankName: bankDetails.bankName,
            accountHolderName: bankDetails.accountHolderName,
            accountNumber: bankDetails.accountNumber,
            ifscCode: bankDetails.ifscCode,
            branchName: bankDetails.branchName,
          },
          create: {
            employeeId: id,
            bankName: bankDetails.bankName,
            accountHolderName: bankDetails.accountHolderName,
            accountNumber: bankDetails.accountNumber,
            ifscCode: bankDetails.ifscCode,
            branchName: bankDetails.branchName,
          },
        });
      }

      // 3. Update or Create salary structure if fixedGross is provided
      if (fixedGross !== undefined && fixedGross !== null) {
        const gross = parseFloat(fixedGross);
        const tea = parseFloat(teaAllowance || 0);
        const basicPct = parseFloat(basicPercentage || 40);
        const hraPct = parseFloat(hraPercentage || 30);
        const convPct = parseFloat(conveyancePercentage || 30);

        const remainingGross = gross - tea;
        const fixedBasic = remainingGross * (basicPct / 100);
        const fixedHra = remainingGross * (hraPct / 100);
        const fixedConveyance = remainingGross * (convPct / 100);

        // Check if a salary structure record already exists for this employee
        const existingStructure = await tx.salaryStructure.findFirst({
          where: { employeeId: id },
          orderBy: { effectiveFrom: 'desc' },
        });

        if (existingStructure) {
          await tx.salaryStructure.update({
            where: { id: existingStructure.id },
            data: {
              fixedGross: gross,
              teaAllowance: tea,
              basicPercentage: basicPct,
              hraPercentage: hraPct,
              conveyancePercentage: convPct,
              fixedBasic,
              fixedHra,
              fixedConveyance,
              updatedBy: req.user.id,
            },
          });
        } else {
          await tx.salaryStructure.create({
            data: {
              employeeId: id,
              fixedGross: gross,
              teaAllowance: tea,
              basicPercentage: basicPct,
              hraPercentage: hraPct,
              conveyancePercentage: convPct,
              fixedBasic,
              fixedHra,
              fixedConveyance,
              effectiveFrom: existing.joiningDate || new Date(),
              createdBy: req.user.id,
            },
          });
        }
      }

      // Log action
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'Employee Updated',
          entityType: 'Employee',
          entityId: id,
          description: `Updated profile details and salary structure for employee ${emp.employeeCode}`,
        },
      });

      return emp;
    });

    return res.json({ message: 'Employee updated successfully', employee: updated });
  } catch (error) {
    console.error('Update employee error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

/**
 * DELETE /api/employees/:id (Soft Delete)
 * Deactivates worker user session, user account, and employee profile
 */
export async function deactivateEmployee(req, res) {
  const { id } = req.params;

  try {
    const employee = await prisma.employee.findFirst({ where: { id, isActive: true } });
    if (!employee) {
      return res.status(404).json({ error: { message: 'Employee not found' } });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Deactivate employee record
      await tx.employee.update({
        where: { id },
        data: {
          isActive: false,
          status: 'INACTIVE',
          updatedBy: req.user.id,
        },
      });

      // 2. Find and deactivate User account
      const user = await tx.user.findUnique({
        where: { employeeId: employee.employeeCode },
      });

      if (user) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            isActive: false,
            updatedBy: req.user.id,
          },
        });

        // 3. Clear active sessions
        await tx.userSession.deleteMany({
          where: { userId: user.id },
        });
      }

      // Log action
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'Employee Deactivated',
          entityType: 'Employee',
          entityId: id,
          description: `Deactivated profile and account of employee ${employee.employeeCode}`,
        },
      });
    });

    return res.json({ message: `Employee ${employee.employeeCode} deactivated successfully` });
  } catch (error) {
    console.error('Deactivate employee error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

/**
 * GET /api/employees/profile/me
 * Self-service: Fetch logged in worker's own profile
 */
export async function getMyProfile(req, res) {
  try {
    const employee = await prisma.employee.findFirst({
      where: { employeeCode: req.user.employeeId, isActive: true },
      include: {
        designation: true,
        bankDetails: true,
        familyMembers: true,
        education: true,
        employmentHistory: true,
        documents: true,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: { message: 'Employee profile not found' } });
    }

    return res.json(employee);
  } catch (error) {
    console.error('Get my profile error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

/**
 * GET /api/employees/attendance/me
 * Self-service: Fetch logged in worker's own attendance logs
 */
export async function getMyAttendance(req, res) {
  try {
    const employee = await prisma.employee.findFirst({
      where: { employeeCode: req.user.employeeId, isActive: true },
    });

    if (!employee) {
      return res.status(404).json({ error: { message: 'Employee profile not found' } });
    }

    const logs = await prisma.attendance.findMany({
      where: { employeeId: employee.id },
      orderBy: { attendanceDate: 'desc' },
    });

    return res.json(logs);
  } catch (error) {
    console.error('Get my attendance logs error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

/**
 * GET /api/employees/payroll/me
 * Self-service: Fetch logged in worker's own payroll run history and payslips
 */
export async function getMyPayroll(req, res) {
  try {
    const employee = await prisma.employee.findFirst({
      where: { employeeCode: req.user.employeeId, isActive: true },
    });

    if (!employee) {
      return res.status(404).json({ error: { message: 'Employee profile not found' } });
    }

    const payrollItems = await prisma.payrollItem.findMany({
      where: { employeeId: employee.id },
      include: {
        payrollBatch: true,
        payslips: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(payrollItems);
  } catch (error) {
    console.error('Get my payroll items error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

