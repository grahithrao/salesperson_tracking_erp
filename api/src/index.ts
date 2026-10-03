import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { initSocketServer } from './socket';

// Route imports
import authRoutes from './routes/auth';
import accessCodesRoutes from './routes/accessCodes';
import expensesRoutes from './routes/expenses';
import salespersonsRoutes from './routes/salespersons';
import clientsRoutes from './routes/clients';
import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';
import paymentsRoutes from './routes/payments';
import attendanceRoutes from './routes/attendance';
import locationRoutes from './routes/location';
import visitsRoutes from './routes/visits';
import reportsRoutes from './routes/reports';
import syncRoutes from './routes/sync';
import settingsRoutes from './routes/settings';
import auditLogsRoutes from './routes/auditLogs';
import notificationsRoutes from './routes/notifications';
import filesRoutes from './routes/files';
import docsRoutes from './routes/docs';
import dashboardRoutes from './routes/dashboard';

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO Server
const io = initSocketServer(httpServer);

// Security and utility middlewares
app.use(helmet({ contentSecurityPolicy: false })); // allow swagger CDN
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', apiLimiter);

// Health check endpoint
const getHealth = (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: '1.1.0',
    features: {
      socketIO: true,
      accessCodeAuth: true,
      expensesManagement: true,
      routeTracking: true,
    },
  });
};
app.get('/health', getHealth);
app.get('/api/health', getHealth);

// Register API modules
app.use('/api/auth', authRoutes);
app.use('/api/access-codes', accessCodesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/salespersons', salespersonsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global Error Handler
app.use(errorHandler);

let server: any;
if (require.main === module) {
  server = httpServer.listen(config.port, () => {
    console.log(`🚀 Sales ERP API running on http://localhost:${config.port}`);
    console.log(`📚 API Docs available at http://localhost:${config.port}/api/docs`);
    console.log(`⚡ Socket.IO real-time engine active on port ${config.port}`);
  });
}

export { app, httpServer, server, io };
export * from './db';
