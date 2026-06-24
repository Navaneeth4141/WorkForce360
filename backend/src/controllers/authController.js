import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
const JWT_SECRET = process.env.JWT_SECRET || 'elitestaffing_secret_key_123456';
const TOKEN_EXPIRY_HOURS = 24;

/**
 * POST /api/auth/login
 * Handles both Admin and Worker login
 */
export async function login(req, res) {
  const { employeeId, password } = req.body;

  if (!employeeId || !password) {
    return res.status(400).json({ error: { message: 'Employee ID and password are required' } });
  }

  try {
    // 1. Fetch user from database
    const user = await prisma.user.findUnique({
      where: { employeeId: String(employeeId).trim() },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: { message: 'Invalid Employee ID or Password' } });
    }

    // 2. Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: { message: 'Invalid Employee ID or Password' } });
    }

    // 3. Generate token
    const token = jwt.sign(
      { id: user.id, employeeId: user.employeeId, role: user.role },
      JWT_SECRET,
      { expiresIn: `${TOKEN_EXPIRY_HOURS}h` }
    );

    // 4. Calculate expiration timestamp
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    // 5. Store session in database (supports revocation)
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // 6. Update user's last login and log audit trail
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'Login Successful',
        entityType: 'User',
        entityId: user.id,
        description: `User ${user.employeeId} logged in successfully`,
      },
    });

    return res.json({
      message: 'Login successful',
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        employeeId: user.employeeId,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: { message: 'Internal server error during login' } });
  }
}

/**
 * POST /api/auth/logout
 * Revokes current session
 */
export async function logout(req, res) {
  try {
    // Delete the specific session matching this JWT
    await prisma.userSession.deleteMany({
      where: { token: req.token },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'Logout Successful',
        entityType: 'User',
        entityId: req.user.id,
        description: `User ${req.user.employeeId} logged out`,
      },
    });

    return res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: { message: 'Internal server error during logout' } });
  }
}

/**
 * POST /api/auth/change-password
 * Allows authenticated user to update their password
 */
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: { message: 'Current password and new password are required' } });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: { message: 'Incorrect current password' } });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    // Revoke all other active sessions for security
    await prisma.userSession.deleteMany({
      where: {
        userId: user.id,
        NOT: { token: req.token },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'Password Changed',
        entityType: 'User',
        entityId: user.id,
        description: `User ${user.employeeId} changed their password`,
      },
    });

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

/**
 * POST /api/auth/reset-password
 * Admin only password reset for any worker account
 */
export async function resetPassword(req, res) {
  const { employeeId } = req.body; // Target worker ID to reset

  if (!employeeId) {
    return res.status(400).json({ error: { message: 'Employee ID is required' } });
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { employeeId },
    });

    if (!targetUser) {
      return res.status(404).json({ error: { message: 'Target user not found' } });
    }

    // Default password reset dynamically (e.g., ESS001 -> ESS@001)
    const defaultPassword = employeeId.startsWith('ESS') 
      ? employeeId.replace('ESS', 'ESS@') 
      : `${employeeId}@123`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await prisma.user.update({
      where: { employeeId },
      data: { passwordHash: hashedPassword },
    });

    // Revoke all sessions of the target user
    await prisma.userSession.deleteMany({
      where: { userId: targetUser.id },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id, // Admin doing the reset
        action: 'Password Reset by Admin',
        entityType: 'User',
        entityId: targetUser.id,
        description: `Admin reset password of employee ${employeeId} to default`,
      },
    });

    return res.json({
      message: `Password reset successfully for ${employeeId}`,
      defaultPassword,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}
