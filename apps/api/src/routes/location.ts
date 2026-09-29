import { Router, Request, Response } from 'express';
import { prisma, Role, SalespersonStatus } from '@erp/database';
import { locationUpdateSchema, isValidCoordinate, calculatePathDistanceKm } from '@erp/shared';
import { authenticateToken, getAuthorizedSalespersonIds } from '../middleware/auth';

const router = Router();

// POST /api/location/update (Section 23: Location API batch ingest)
router.post('/update', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const parsed = locationUpdateSchema.parse(req.body);
  const user = req.user!;

  const salespersonId = user.salespersonId;
  if (!salespersonId) {
    res.status(403).json({ error: 'Only salesperson accounts can report location points' });
    return;
  }

  // Verify salesperson is ON_DUTY
  const salesperson = await prisma.salesperson.findUnique({
    where: { id: salespersonId },
    select: { status: true },
  });

  if (!salesperson || salesperson.status !== SalespersonStatus.ON_DUTY) {
    res.status(403).json({
      error: 'Location rejected: Salesperson is not ON DUTY. Start day before tracking.',
    });
    return;
  }

  // Find or verify active location session
  let sessionId = parsed.sessionId;
  if (!sessionId) {
    const activeSession = await prisma.locationSession.findFirst({
      where: {
        salespersonId,
        status: 'ACTIVE',
      },
      orderBy: { startedAt: 'desc' },
    });

    if (!activeSession) {
      res.status(400).json({ error: 'No active tracking session found' });
      return;
    }
    sessionId = activeSession.id;
  }

  // Validate coordinates and sanitize timestamps
  const validPoints = [];
  const now = new Date();

  for (const pt of parsed.points) {
    if (!isValidCoordinate(pt.latitude, pt.longitude)) {
      continue;
    }

    const timestamp = new Date(pt.timestamp);
    // Ignore points in the distant future (>5 mins ahead)
    if (timestamp.getTime() > now.getTime() + 5 * 60 * 1000) {
      continue;
    }

    validPoints.push({
      sessionId,
      salespersonId,
      latitude: pt.latitude,
      longitude: pt.longitude,
      accuracy: pt.accuracy !== undefined ? pt.accuracy : null,
      speed: pt.speed !== undefined ? pt.speed : null,
      heading: pt.heading !== undefined ? pt.heading : null,
      batteryLevel: pt.batteryLevel !== undefined ? pt.batteryLevel : null,
      networkType: pt.networkType || null,
      deviceId: pt.deviceId || null,
      timestamp,
    });
  }

  if (validPoints.length > 0) {
    await prisma.locationPoint.createMany({
      data: validPoints,
    });
  }

  res.json({
    message: 'Location points received successfully',
    pointsIngested: validPoints.length,
  });
});

// GET /api/location/current (Section 6.3: Admin Live Map)
router.get('/current', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const authorizedSalespersonIds = getAuthorizedSalespersonIds(user);

  const whereClause: any = {};
  if (authorizedSalespersonIds !== undefined) {
    whereClause.id = { in: authorizedSalespersonIds };
  }

  const salespersons = await prisma.salesperson.findMany({
    where: whereClause,
    include: {
      user: { select: { name: true, phone: true } },
      locationPoints: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
      clientAssignments: {
        where: { active: true },
        include: {
          client: {
            select: { id: true, name: true, latitude: true, longitude: true, currentOutstanding: true },
          },
        },
      },
      attendances: {
        where: { status: 'ON_DUTY' },
        take: 1,
      },
    },
  });

  const liveTrackers = salespersons.map((s) => {
    const lastPoint = s.locationPoints[0];
    const isOnline = s.status === SalespersonStatus.ON_DUTY;

    return {
      salespersonId: s.id,
      name: s.user.name,
      employeeCode: s.employeeCode,
      phone: s.user.phone,
      territory: s.territory,
      dutyStatus: s.status,
      isOnline,
      currentLocation: lastPoint ? {
        latitude: lastPoint.latitude,
        longitude: lastPoint.longitude,
        accuracy: lastPoint.accuracy,
        speed: lastPoint.speed,
        heading: lastPoint.heading,
        batteryLevel: lastPoint.batteryLevel,
        timestamp: lastPoint.timestamp,
      } : null,
      assignedClients: s.clientAssignments.map((a) => ({
        id: a.client.id,
        name: a.client.name,
        latitude: a.client.latitude,
        longitude: a.client.longitude,
        outstanding: Number(a.client.currentOutstanding),
      })),
    };
  });

  res.json({ data: liveTrackers });
});

// GET /api/location/history (Section 6.4 & 16: Route History & Polyline)
router.get('/history', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { salespersonId, date } = req.query;
  const user = req.user!;
  const authorizedSalespersonIds = getAuthorizedSalespersonIds(user);

  let targetSalespersonId = salespersonId as string;
  if (!targetSalespersonId) {
    if (user.role === Role.SALESPERSON && user.salespersonId) {
      targetSalespersonId = user.salespersonId;
    } else {
      res.status(400).json({ error: 'salespersonId parameter is required' });
      return;
    }
  }

  if (authorizedSalespersonIds !== undefined && !authorizedSalespersonIds.includes(targetSalespersonId)) {
    res.status(403).json({ error: 'Access denied to this salesperson location history' });
    return;
  }

  const queryDate = date ? new Date(date as string) : new Date();
  const startOfDay = new Date(queryDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(queryDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch chronological GPS points
  const points = await prisma.locationPoint.findMany({
    where: {
      salespersonId: targetSalespersonId,
      timestamp: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { timestamp: 'asc' },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      accuracy: true,
      speed: true,
      batteryLevel: true,
      timestamp: true,
    },
  });

  // Fetch stops / events during the day
  const [visits, orders, payments, attendance] = await Promise.all([
    prisma.clientVisit.findMany({
      where: {
        salespersonId: targetSalespersonId,
        startedAt: { gte: startOfDay, lte: endOfDay },
      },
      include: { client: { select: { id: true, name: true, address: true } } },
      orderBy: { startedAt: 'asc' },
    }),
    prisma.order.findMany({
      where: {
        salespersonId: targetSalespersonId,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.payment.findMany({
      where: {
        salespersonId: targetSalespersonId,
        collectedAt: { gte: startOfDay, lte: endOfDay },
      },
      include: { client: { select: { name: true } } },
      orderBy: { collectedAt: 'asc' },
    }),
    prisma.attendance.findFirst({
      where: {
        salespersonId: targetSalespersonId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    }),
  ]);

  const estimatedDistanceKm = calculatePathDistanceKm(points);

  res.json({
    salespersonId: targetSalespersonId,
    date: startOfDay.toISOString().split('T')[0],
    pointsCount: points.length,
    estimatedDistanceKm,
    attendance: attendance ? {
      loginAt: attendance.loginAt,
      logoutAt: attendance.logoutAt,
      status: attendance.status,
      workingMinutes: attendance.workingMinutes,
    } : null,
    points,
    events: {
      visits: visits.map((v) => ({
        id: v.id,
        clientId: v.clientId,
        clientName: v.client.name,
        latitude: v.latitude,
        longitude: v.longitude,
        startedAt: v.startedAt,
        endedAt: v.endedAt,
        outcome: v.outcome,
        distanceFromClient: v.distanceFromClient,
      })),
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        clientName: o.client.name,
        grandTotal: Number(o.grandTotal),
        createdAt: o.createdAt,
        latitude: o.latitude,
        longitude: o.longitude,
      })),
      payments: payments.map((p) => ({
        id: p.id,
        receiptNumber: p.receiptNumber,
        clientName: p.client.name,
        amount: Number(p.amount),
        method: p.paymentMethod,
        collectedAt: p.collectedAt,
      })),
    },
  });
});

export default router;
