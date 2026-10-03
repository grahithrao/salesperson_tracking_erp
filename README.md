# FieldTrack ERP — Salesperson Tracking & Sales Management System

A production-grade, enterprise Field Sales Management and GPS Tracking ERP adhering to the complete 22-page, 41-section technical specification.

---

## 🌟 System Architecture & Monorepo Layout

```
salesperson_tracking_erp/
├── api/                   # Node.js + Express REST API & Database (Prisma ORM, PostgreSQL, Socket.io)
├── admin/                 # Next.js 14 Web Dashboard (Tailwind CSS, Recharts, Leaflet Live Maps)
├── app/                   # React Native with Expo (User-Facing Salesperson App, Native GPS, Offline Sync)
├── shared/                # Shared DTOs, Zod schemas, geo formulas, exact order calculator
├── docs/                  # Detailed documentation mapping all 41 spec sections
│   ├── requirements_checklist.md          # 41-section verification traceability table
│   ├── architecture.md                    # Data flow, ledger mechanics, sync engine design
│   ├── api_reference.md                   # Complete REST API reference
│   ├── deployment_and_operations.md       # Production setup, backups, PM2, EAS Build
│   └── mobile_device_testing_checklist.md # Physical device field verification guide
└── package.json           # Monorepo workspaces configuration
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js 18+ (tested on Node.js 20 & 22)
- PostgreSQL 14+ (local or hosted)

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup & Seeding
Ensure PostgreSQL is running locally and `DATABASE_URL` is set:
```bash
# Push schema and generate Prisma client
npm run db:push

# Populate database with complete seed data
npm run db:seed
```

### 4. Run Applications Locally
In separate terminal tabs:

```bash
# 1. Start Express Backend API (Port 4000)
npm run dev:api

# 2. Start Next.js Admin Dashboard (Port 3001)
npm run dev:admin

# 3. Start Expo Salesperson Mobile App
npm run dev:app   # or npm run dev:mobile
```

- **Admin Web Dashboard**: [http://localhost:3001](http://localhost:3001)
- **Backend API**: [http://localhost:4000](http://localhost:4000)
- **Interactive Swagger Docs**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## 🔐 Development Credentials

| Role | Identifier | Password | Details |
|---|---|---|---|
| **Super Admin** | `admin@erp.com` | `Password123!` | Full system access, all salespersons, clients, approvals |
| **Manager** | `manager@erp.com` | `Password123!` | Assigned team scope (Rahul & Ahmed in Mangalore) |
| **Salesperson** | `rahul@erp.com` | `Password123!` | Emp Code: `EMP-001`, Phone: `9876543212` (ON DUTY) |
| **Salesperson** | `ahmed@erp.com` | `Password123!` | Emp Code: `EMP-002`, Phone: `9876543213` (ON DUTY) |
| **Salesperson** | `vishal@erp.com` | `Password123!` | Emp Code: `EMP-003`, Phone: `9876543214` (OFF DUTY) |

---

## 🧪 Automated Verification Suite

Run the end-to-end integration test suite covering 16 critical business workflows:
```bash
npm --workspace=@erp/api test
```

### Verified Test Suites:
1. `API Health check`: `/health` responds healthy.
2. `Super Admin Authentication`: JWT issued with role permissions.
3. `Salesperson Authentication`: Scoped token issued.
4. `Salesperson Dashboard`: Real-time aggregated metrics from database.
5. `Admin Dashboard Summary`: Aggregations of sales, orders, outstanding debt, and charts.
6. `Admin Live Status`: Real-time duty state, speed, battery, and relative timestamps.
7. `Client Scoping`: Salesperson receives only assigned accounts with distance calculation.
8. `Visit GPS Verification`: Calculates distance from registered client location via Haversine formula.
9. `Visit Completion`: Stores outcome and notes with exception handling.
10. `Order Arithmetic`: Strictly verifies true subtotal ($₹7,050$), discount ($₹450$), net taxable ($₹6,600$), GST ($₹1,188$), and Grand Total ($₹7,788$).
11. `Payment Capture`: Creates provisional collection record with formatted receipt number.
12. `Payment Verification`: Admin approval posts immutable `CREDIT` to `ClientLedgerEntry` and reduces customer debt.
13. `PDF Receipt Generation`: Generates formatted PDF voucher stream.
14. `CSV Report Export`: Exports sales report data as CSV.
15. `Offline Batch Sync`: Processes outbox operations in a single atomic transaction.
16. `Idempotency Deduplication`: Prevents duplicate orders or payments upon network retry.
