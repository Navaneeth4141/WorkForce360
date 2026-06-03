import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'elitestaffing_secret_key_123456';

/**
 * Main authentication middleware validating token validity and matching DB session
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: { message: 'Authentication token required' } });
  }

  try {
    // 1. Verify token signature
    const decoded = jwt.verify(token, JWT_SECRET);

    // 2. Validate token against active sessions database (support logout)
    const session = await prisma.userSession.findFirst({
      where: { token, userId: decoded.id },
    });

    if (!session || new Date() > new Date(session.expiresAt)) {
      return res.status(401).json({ error: { message: 'Session expired or invalidated. Please login again.' } });
    }

    // 3. Retrieve user profile and status check
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, employeeId: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ error: { message: 'Account is deactivated or does not exist' } });
    }

    // 4. Bind auth credentials to request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('JWT authentication error:', error.message);
    return res.status(403).json({ error: { message: 'Invalid or expired token' } });
  }
}

/**
 * Middleware enforcing role permissions
 * @param {Array<string>} roles - List of allowed roles (e.g. ['ADMIN', 'WORKER'])
 */
export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'User not authenticated' } });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: { message: 'Access denied: Insufficient privileges' } });
    }

    next();
  };
}
