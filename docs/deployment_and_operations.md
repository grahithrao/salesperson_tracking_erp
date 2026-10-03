# FieldTrack ERP — Deployment & Operations Guide

## 1. Environment Configuration

Create `.env` in the root workspace and in each respective application folder:

### 1.1 Backend API (`api/.env`)
```env
# Server
PORT=4000
NODE_ENV=production
APP_SECRET=your-secure-jwt-signing-secret-at-least-32-chars
TOKEN_EXPIRY=7d

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/salesperson_erp?schema=public"

# CORS & Domains
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,https://admin.yourdomain.com"

# Storage & S3 (Optional - falls back to local uploads directory)
S3_BUCKET_NAME=fieldtrack-erp-assets
S3_REGION=ap-south-1
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

# Map & Geocoding
MAP_PROVIDER=openstreetmap # or google, mapbox
GOOGLE_MAPS_API_KEY=
```

### 1.2 Web Admin Dashboard (`admin/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
PORT=3001
```

### 1.3 Salesperson Mobile Application (`app/src/config.ts`)
```typescript
export const API_BASE_URL = 'http://YOUR_SERVER_IP:4000';
```

---

## 2. Database Management

### 2.1 Prisma Migrations & Schema Deployment
To apply pending database migrations to a production database:
```bash
# Push schema or deploy migrations
npm run db:migrate
# Or direct push
npx prisma db push --schema=api/prisma/schema.prisma
```

### 2.2 Seeding Initial Data
The seed script populates default administrator accounts, product categories, products, clients with realistic geographic coordinates, and active work sessions:
```bash
npm run db:seed
```

### 2.3 Initial Administrator Credentials
The development seed populates the following accounts:
- **Super Administrator**: `admin@erp.com` / `Password123!`
- **Manager**: `manager@erp.com` / `Password123!`
- **Salesperson (Rahul)**: `rahul@erp.com` / `Password123!` (Employee Code: `EMP-001`, Phone: `9876543212`)
- **Salesperson (Ahmed)**: `ahmed@erp.com` / `Password123!` (Employee Code: `EMP-002`, Phone: `9876543213`)
- **Salesperson (Vishal)**: `vishal@erp.com` / `Password123!` (Employee Code: `EMP-003`, Phone: `9876543214`)

> **IMPORTANT**: In production, immediately change these default passwords via the Admin Settings page or database query.

---

## 3. Database Backup & Disaster Recovery

### 3.1 Automated PostgreSQL Backup
Create a daily automated cron job to perform `pg_dump`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/salesperson_erp"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR
pg_dump -U postgres -d salesperson_erp -F c -b -v -f "$FILENAME"
# Retain backups for 30 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -exec rm {} +
```

### 3.2 Database Restoration
To restore from a backup archive:
```bash
# Drop existing database and recreate
dropdb -U postgres salesperson_erp
createdb -U postgres salesperson_erp

# Restore from compressed archive
pg_restore -U postgres -d salesperson_erp -v "$BACKUP_FILE"
```

---

## 4. Production Process Management (PM2)

For standard Linux host deployments, use PM2 to manage API and Web instances:

### 4.1 Ecosystem File (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [
    {
      name: 'erp-api',
      cwd: './api',
      script: 'dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
    {
      name: 'erp-admin',
      cwd: './admin',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

To start:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## 5. Mobile Native Build & Release (Expo / EAS)

The mobile application is built with Expo React Native and configured for background location tracking permissions in `app.json`.

### 5.1 Prerequisites
Install the Expo Application Services (EAS) CLI:
```bash
npm install -g eas-cli
eas login
```

### 5.2 Android Production Build (APK / AAB)
```bash
cd app
eas build --platform android --profile production
```
Key Android background location permissions configured:
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`
- `FOREGROUND_SERVICE`
- `FOREGROUND_SERVICE_LOCATION`

### 5.3 iOS Production Build (IPA)
```bash
cd app
eas build --platform ios --profile production
```
Key iOS `Info.plist` privacy keys configured:
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`
- `UIBackgroundModes`: `["location", "fetch"]`

---

## 6. Security & Hardening Checklist

1. **HTTPS Enforcement**: Terminate TLS at Nginx or Cloudflare reverse proxy with HSTS enabled.
2. **Rate Limiting**: Rate limiter is active on all `/api` endpoints (configured at 200 requests / 15 minutes per IP).
3. **Audit Trails**: All sensitive actions (login attempts, order approvals, payment verification, client reassignments) are automatically written to the `AuditLog` table.
4. **Data Isolation**: Never pass `salespersonId` as an unvalidated query parameter for salesperson users; the middleware always overrides it with `req.user.salespersonId`.
