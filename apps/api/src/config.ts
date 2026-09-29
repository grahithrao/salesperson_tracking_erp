import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'super-secret-salesperson-erp-key-2026-production-ready',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  uploadDir: path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../uploads')),
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'],
};
