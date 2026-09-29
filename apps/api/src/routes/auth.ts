import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, UserStatus } from '@erp/database';
import { loginSchema } from '@erp/shared';
import { config } from '../config';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticateToken } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

const router = Router();

router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.parse(req.body);
  const { identifier, password, deviceId } = parsed;

  // Find user by email, phone, or employeeCode
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { phone: identifier },
        { salespersonProfile: { employeeCode: identifier } },
      ],
    },
    include: {
      salespersonProfile: true,
      managerPermissions: true,
      managedSalespersons: { select: { salespersonId: true } },
    },
  });

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (user.status !== UserStatus.ACTIVE) {
    res.status(403).json({ error: 'Account has been deactivated. Contact your administrator.' });
    return;
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    await logAuditEvent({
      req,
      userId: user.id,
      action: 'LOGIN_FAILED',
      module: 'AUTH',
      oldValue: { identifier },
    });
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  // Update device ID if provided on salesperson profile
  if (deviceId && user.salespersonProfile) {
    await prisma.salesperson.update({
      where: { id: user.salespersonProfile.id },
      data: { deviceId },
    });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  await logAuditEvent({
    req,
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    module: 'AUTH',
    newValue: { role: user.role, email: user.email },
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      salespersonId: user.salespersonProfile?.id,
      employeeCode: user.salespersonProfile?.employeeCode,
      territory: user.salespersonProfile?.territory,
      dutyStatus: user.salespersonProfile?.status,
    },
    expiresIn: '7d',
  });
});

router.post('/logout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  if (req.user) {
    await logAuditEvent({
      req,
      userId: req.user.id,
      action: 'LOGOUT',
      module: 'AUTH',
    });
  }
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      salespersonProfile: true,
      managerPermissions: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      salespersonId: user.salespersonProfile?.id,
      employeeCode: user.salespersonProfile?.employeeCode,
      territory: user.salespersonProfile?.territory,
      dutyStatus: user.salespersonProfile?.status,
      permissions: req.user.permissions,
    },
  });
});

export default router;
