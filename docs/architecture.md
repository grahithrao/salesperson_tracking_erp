# FieldTrack ERP — System Architecture & Technical Design

## 1. Monorepo Overview
FieldTrack ERP is engineered as an enterprise-grade monorepo utilizing npm workspaces and modern TypeScript throughout the stack.

```
salesperson_tracking_erp/
├── apps/
│   ├── admin/             # Next.js 14 Web Dashboard (Tailwind CSS, Recharts, Leaflet)
│   ├── api/               # Node.js + Express REST API with TypeScript
│   └── mobile/            # React Native with Expo (TypeScript, Offline Sync, Native GPS)
├── packages/
│   ├── database/          # PostgreSQL schema, Prisma ORM, migrations, and seed script
│   └── shared/            # Shared DTOs, Zod validation schemas, business logic, geo helpers
├── docs/                  # System specifications, API docs, operations guides, checklists
└── package.json           # Root workspace configuration
```

---

## 2. High-Level Data Flow

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│       Admin / Manager Web       │       │    Salesperson Mobile App       │
│         (Next.js 14)            │       │       (React Native / Expo)     │
│   • Live Tracking Map           │       │   • Start / End Day Attendance  │
│   • Order Approval & Dispatch   │       │   • Client Visits & GPS Audit   │
│   • Collection Verification     │       │   • Product Catalog & Orders    │
│   • Financial Ledger Reports    │       │   • Payments & Offline Outbox   │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │                                         │
                 │ HTTPS / REST (JWT)                      │ HTTPS / REST (JWT)
                 ▼                                         ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                            Express REST API                               │
│   • Server-side RBAC & Record-Level Data Isolation                        │
│   • Exact Tax & Discount Arithmetic Engine                                │
│   • Idempotency Deduplication & Outbox Synchronization Engine             │
│   • Comprehensive Audit Logger                                            │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database (Prisma ORM)                     │
│   • 17 Relational Models with Strict Foreign Key Constraints             │
│   • Authoritative Double-Entry Client Ledger (`ClientLedgerEntry`)        │
│   • High-Performance B-Tree Indexes on Lat/Lng, Dates, and IDs            │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Architecture & Entity Relationships

The database schema is defined in `packages/database/prisma/schema.prisma` and consists of 17 core entities:

1. **User**: Authentication credentials (`passwordHash` with bcrypt), contact information, and role (`SUPER_ADMIN`, `MANAGER`, `SALESPERSON`).
2. **Salesperson**: Extends User with `employeeCode`, `joiningDate`, `territory`, `managerId`, `dutyStatus`, and hardware `deviceId`.
3. **ManagerSalesperson**: Configurable many-to-many relationship mapping managers to their assigned field teams.
4. **Client**: Full corporate registry including business name, contact person, mobile, email, GST number, physical address, GPS coordinates, category, credit limit, and payment terms.
5. **ClientAssignment**: Complete audit history of primary and backup salesperson assignments to clients, preserving historical accountability.
6. **ProductCategory**: Hierarchical product classification.
7. **Product**: Catalog items with SKU, unit of measure, selling price, MRP, GST rate, current stock, and safety minimum stock thresholds.
8. **Order**: Commercial purchase orders with auto-generated formatted numbering (`ORD-YYYY-XXXXXX`), customer reference, GPS coordinates at order placement, subtotal, discount, GST, and grand total.
9. **OrderItem**: Line-item details with immutable unit price snapshots, line discounts, line taxes, and line totals.
10. **Payment**: Collections captured in the field across Cash, UPI, Bank Transfer, Cheque, and Card with unique provisional receipt codes (`PAY-YYYY-XXXXX`).
11. **ClientLedgerEntry**: Immutable accounting transactions that establish the client's current outstanding balance through debit (invoicing) and credit (verified payment) entries.
12. **Attendance**: Daily work sessions tracking check-in time/coordinates, check-out time/coordinates, total working minutes, and cumulative distance.
13. **LocationSession**: High-resolution tracking sessions tied to attendance records.
14. **LocationPoint**: GPS breadcrumb data containing latitude, longitude, accuracy (meters), speed (m/s), battery percentage, heading, and capture timestamp.
15. **ClientVisit**: Records salesperson arrival at a client location with GPS verification distance (meters), breach flags, outcome status, and notes.
16. **Notification**: User-targeted alerts for administrative approvals, work-start notifications, and operational exceptions.
17. **AuditLog**: Comprehensive security log capturing every state transition, user identity, IP address, and JSON diffs of before/after records.

---

## 4. Exact Financial Arithmetic & Client Ledger Mechanics

### 4.1 Order Arithmetic Compliance
Per Section 10.2 of the specification, order arithmetic strictly enforces accurate taxation:
- **Line Subtotal**: $\sum (\text{Quantity} \times \text{Selling Price})$
- **Proportional Line Discount**: Line discounts are applied proportionately before calculating taxable values.
- **GST Computation**: GST is computed on the net taxable amount ($\text{Line Price} - \text{Discount}$), preserving exact minor-unit precision.
- **Grand Total**: $\text{Net Taxable Amount} + \text{Total GST}$.

### 4.2 Authoritative Double-Entry Ledger
The system guarantees financial integrity by deriving customer debt exclusively from `ClientLedgerEntry`:
- **Debit Entry**: Created when an order is confirmed or an invoice is generated. Increases `currentOutstanding`.
- **Credit Entry**: Created **ONLY when a payment is marked `VERIFIED`** by an administrator or manager. Decreases `currentOutstanding`.
- **Pending Collections**: When a salesperson records a collection in the field, it enters the system in `PENDING` status. Pending payments are displayed separately on dashboards and statements and **never reduce verified outstanding debt** until verified.
- **Reversal Entry**: If a payment verification is rejected or cancelled, an offsetting debit entry is created with an audit trail, ensuring historical records are never deleted.

---

## 5. Offline-First Synchronization Engine

Field salespeople frequently operate in environments with intermittent cellular connectivity. The mobile application employs the **Outbox Pattern**:

```
[Mobile Action] ──► [Write to Local SQLite / AsyncStorage Outbox] ──► [UI Optimistic Update]
                                  │
                                  ▼ (Periodic or On-Demand Trigger)
                       [Network Connectivity Check]
                                  │
                                  ▼ (If Online)
                     [POST /api/sync/batch]
                                  │
                                  ▼
         ┌─────────────────────────────────────────────────┐
         │              Backend Sync Handler               │
         │  1. Check Idempotency Key in Database           │
         │  2. If duplicate -> Return existing Server ID   │
         │  3. If new -> Create record in DB transaction   │
         │  4. Return mapping: localId -> serverId         │
         └────────────────────────┬────────────────────────┘
                                  │
                                  ▼
           [Update Local Outbox Status: PENDING ➔ SYNCED]
```

### 5.1 Idempotency Key Strategy
Every offline operation generates a globally unique UUID idempotency key:
- `order-${uuid}`
- `pay-${uuid}`
- `visit-${uuid}`
- `att-start-${uuid}`

If network transmission fails and the mobile app re-sends the payload, the backend detects the existing idempotency key and returns the previously generated server record without duplicating orders or ledger credits.

---

## 6. Native Mobile GPS Tracking Lifecycle

1. **Permission Onboarding**: The app presents a clear privacy notice explaining that GPS tracking is active solely while the employee is "ON DUTY". It requests foreground (`ACCESS_FINE_LOCATION`) followed by background (`ACCESS_BACKGROUND_LOCATION`) permissions.
2. **Start Day Activation**:
   - Captures current GPS coordinates and device metadata.
   - Sets salesperson status to `ON_DUTY` in the database.
   - Initiates `expo-location` background location task (`FIELD_TRACK_LOCATION_TASK`).
3. **Adaptive Tracking**:
   - Default polling interval: 60 to 120 seconds while moving.
   - Adaptive stationary dampening: GPS captures are throttled when speed $< 1.0$ m/s to conserve device battery.
4. **End Day Termination**:
   - Immediately unregisters the background location task locally.
   - Sends checkout coordinates and finalizes attendance metrics.
   - Renders the Section 34 Daily Summary popup.
   - Guarantees zero location tracking outside active duty sessions.
