# AssetFlow - Odoo Hackathon 2026 PS-01

**Enterprise Asset & Resource Management System**

A centralized ERP platform to simplify how organizations track, allocate, and maintain physical assets and shared resources — without spreadsheets, paper logs, or accounting modules.

---

## Vision

AssetFlow digitizes asset and resource management for any organization that owns equipment, furniture, vehicles, or shared spaces — offices, schools, hospitals, factories, agencies, and more.

The platform reduces manual tracking inefficiencies by enabling:

- Structured asset lifecycles
- Centralized resource booking
- Real-time visibility into **who holds what**, **where it is**, and **its condition**

AssetFlow delivers core ERP functionality with clean architecture, role-based workflows, and scalable module design — **without** purchasing, invoicing, or accounting.

---

## Mission

Build a user-centric, responsive application that gives staff intuitive tools to:

- Set up departments, asset categories, and the employee directory
- Register and track assets through their full lifecycle
- Allocate assets to employees/departments with conflict handling
- Book shared resources (rooms, vehicles, equipment) without overlaps
- Run a structured maintenance approval workflow
- Run structured audit cycles to catch discrepancies
- Get notified of overdue returns, bookings, and maintenance events

---

## Problem Statement

Organizations need a single system to:

| Capability | Description |
|---|---|
| **Master data** | Maintain departments, asset categories, and an employee directory |
| **Asset lifecycle** | Track assets through flexible states with valid transitions |
| **Allocation** | Assign assets to employees/departments; prevent double-allocation |
| **Resource booking** | Book shared/limited resources by time slot with overlap validation |
| **Maintenance** | Route repair requests through approval before work starts |
| **Audits** | Run scheduled audit cycles with assigned auditors and auto-generated discrepancy reports |
| **Visibility** | Surface overdue returns, bookings, and maintenance via notifications and a KPI dashboard |

The application must demonstrate proper ERP architecture, reusable modules, secure role-based workflows (realistic account creation — no self-assigned admin roles), and intuitive UI/UX while handling relationships between departments, employees, assets, bookings, maintenance requests, and audits.

---

## Asset Lifecycle States

| State | Description |
|---|---|
| **Available** | Ready for allocation or booking |
| **Allocated** | Assigned to an employee or department |
| **Reserved** | Held for a pending allocation or transfer |
| **Under Maintenance** | In repair; set automatically on maintenance approval |
| **Lost** | Confirmed missing via audit |
| **Retired** | No longer in active use |
| **Disposed** | Permanently removed from inventory |

**Example transitions:** Available ↔ Under Maintenance · Allocated → Available (on return)

---

## User Roles

| Role | Responsibilities |
|---|---|
| **Admin** | Manages departments, asset categories, audit cycles, and employee/role assignment. Views organization-wide analytics. |
| **Asset Manager** | Registers and allocates assets. Approves transfers, maintenance requests, audit discrepancy resolution, and asset returns. |
| **Department Head** | Views department assets. Approves allocation/transfer requests within their department. Books shared resources for the department. |
| **Employee** | Views assigned assets. Books shared resources. Raises maintenance requests. Initiates return/transfer requests. |

> **Role assignment rule:** Signup creates an **Employee** account only. Admin promotes users to **Department Head** or **Asset Manager** from the Employee Directory — roles are never self-selected at signup.

---

## Features

### 1. Login / Signup

- Email & password authentication, forgot password, session validation
- Signup creates Employee accounts only — no role selection
- Admin promotes roles from the Employee Directory

### 2. Dashboard / Home

- **KPI cards:** Assets Available, Assets Allocated, Maintenance Today, Active Bookings, Pending Transfers, Upcoming Returns
- Overdue returns highlighted separately from upcoming ones
- **Quick actions:** Register Asset · Book Resource · Raise Maintenance Request

### 3. Organization Setup *(Admin only — 3 tabs)*

**Tab A — Department Management**
- Create/edit/deactivate departments
- Assign Department Head, optional Parent Department (hierarchy), Status (Active/Inactive)

**Tab B — Asset Category Management**
- Create/edit categories (Electronics, Furniture, Vehicles, etc.)
- Optional category-specific fields (e.g. warranty period for Electronics)

**Tab C — Employee Directory**
- Name, Email, Department, Role, Status (Active/Inactive)
- Admin promotes Employee → Department Head or Asset Manager

### 4. Asset Registration & Directory

- **Register:** Name, Category, auto-generated Asset Tag (e.g. `AF-0001`), Serial Number, Acquisition Date, Acquisition Cost (reports only), Condition, Location, photo/documents, shared/bookable flag
- Search/filter by Asset Tag, Serial Number, QR code, category, status, department, or location
- Lifecycle status per asset
- Per-asset history: allocation + maintenance

### 5. Asset Allocation & Transfer

- Allocate to employee/department with optional Expected Return Date
- **Conflict rule:** Cannot allocate an asset already held by someone else — system blocks, shows current holder, offers **Transfer Request**
- **Transfer workflow:** Requested → Approved (Asset Manager / Department Head) → Re-allocated (history updated)
- **Return flow:** Mark returned, capture condition check-in notes, status reverts to Available
- Overdue allocations auto-flagged → Dashboard + Notifications

### 6. Resource Booking

- Calendar view of existing bookings per resource
- **Overlap validation:** Overlapping time slots rejected (e.g. 9:00–10:00 blocks 9:30–10:30; 10:00–11:00 is allowed)
- Booking status: Upcoming · Ongoing · Completed · Cancelled
- Cancel/reschedule; reminder notification before slot starts

### 7. Maintenance Management

- Raise request: select asset, describe issue, set priority, attach photo
- **Workflow:** Pending → Approved / Rejected → Technician Assigned → In Progress → Resolved
- Asset status → **Under Maintenance** on approval; → **Available** on resolution
- Maintenance history retained per asset

### 8. Asset Audit

- Create Audit Cycle (scope: department/location, date range)
- Assign one or more auditors
- Auditor marks each asset: Verified · Missing · Damaged
- Auto-generated discrepancy report for flagged items
- Close Audit Cycle — locks cycle, updates statuses (e.g. Missing → Lost)
- Audit history retained per cycle

### 9. Reports & Analytics

- Asset utilization trends; most-used vs. idle assets
- Maintenance frequency by asset/category
- Assets due for maintenance or nearing retirement
- Department-wise allocation summary
- Resource booking heatmap (peak usage windows)
- Exportable reports

### 10. Activity Logs & Notifications

**Notification types:** Asset Assigned · Maintenance Approved/Rejected · Booking Confirmed/Cancelled/Reminder · Transfer Approved · Overdue Return Alert · Audit Discrepancy Flagged

**Activity log:** Full audit trail of admin/manager/employee actions (who did what, when)

---

## Basic Workflow

```
Admin sets up org (departments, categories, roles)
        ↓
Asset Manager registers asset → Available
        ↓
Asset allocated to employee/department
  (blocked if already allocated → Transfer Request required)
  OR marked as shared/bookable resource
        ↓
Employees book shared resources by time slot
  (overlapping requests rejected automatically)
        ↓
Maintenance request raised → approved → Under Maintenance → resolved → Available
        ↓
Assets transferred or returned as needs change
  (overdue returns flagged automatically)
        ↓
Periodic audit cycles → auditors verify → discrepancy reports → cycle closed
        ↓
All activity tracked via notifications, logs, and reports
```

---

## Out of Scope

- Purchasing
- Invoicing
- Accounting / financial ledger integration

Acquisition cost is stored for ranking and reports only.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React (Vite), React Router, Tailwind CSS, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas via Mongoose |
| **Auth** | JWT + bcrypt password hashing |
| **File uploads** | Multer (local disk; paths stored in MongoDB) |

---

## Project Structure

```
assetflow/
├── backend/
│   ├── src/
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express route definitions
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth, file upload
│   │   ├── utils/           # Helpers (asset tags, notifications)
│   │   └── server.js
│   ├── uploads/             # Local file storage
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/           # Screen components
│   │   ├── components/      # Layout, sidebar, shared UI
│   │   ├── context/         # Auth context
│   │   ├── services/        # Axios API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)

### 1. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB Atlas URI and JWT secret

npm install
npm run dev
```

Backend runs at **http://localhost:5000**

### 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** (proxies `/api` and `/uploads` to backend)

### Environment Variables

Create `backend/.env` from `.env.example`:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

### First-time usage

1. **Sign up** — the first registered user becomes **Admin**; all subsequent signups are **Employee**
2. Admin sets up **departments**, **categories**, and promotes roles in **Organization Setup**
3. Asset Manager registers assets and begins allocations

---

## API Routes

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register (Employee only; first user = Admin) |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user (JWT) |

### Organization
| Method | Route | Description |
|---|---|---|
| GET/POST/PUT | `/api/departments` | List, create, update departments (Admin write) |
| GET/POST/PUT | `/api/categories` | List, create, update categories (Admin write) |
| GET/PUT | `/api/users` | List users; Admin update department, status, promote role |

### Assets
| Method | Route | Description |
|---|---|---|
| GET/POST/PUT | `/api/assets` | List, register, update assets |
| GET | `/api/assets/bookable` | List bookable resources |
| GET | `/api/assets/:id` | Single asset |
| GET | `/api/assets/:id/history` | Allocation + maintenance history |

### Allocations & Transfers
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/allocations` | List / create allocation |
| POST | `/api/allocations/:id/return` | Return asset |
| GET/POST | `/api/transfers` | List / request transfer |
| POST | `/api/transfers/:id/approve` | Approve or reject transfer |

### Bookings
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/bookings` | List / create booking |
| POST | `/api/bookings/:id/cancel` | Cancel booking |
| GET | `/api/bookings/calendar/:resourceId` | Resource calendar |

### Maintenance
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/maintenance` | List / raise request |
| POST | `/api/maintenance/:id/approve` | Approve or reject (`{ approved: true/false }`) |
| POST | `/api/maintenance/:id/assign-technician` | Assign technician & start work |
| POST | `/api/maintenance/:id/resolve` | Mark resolved |

### Audits
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/audits` | List / create audit cycle |
| GET | `/api/audits/:id` | Cycle detail + items |
| POST | `/api/audits/:id/items` | Submit item result (`{ itemId, result, notes }`) |
| POST | `/api/audits/:id/close` | Close cycle + discrepancy report |
| GET | `/api/audits/:id/discrepancies` | Discrepancy report |

### Dashboard & Reports
| Method | Route | Description |
|---|---|---|
| GET | `/api/dashboard/kpis` | KPI dashboard + overdue flags |
| GET | `/api/reports/utilization` | Asset utilization & idle assets |
| GET | `/api/reports/maintenance-frequency` | Maintenance by category |
| GET | `/api/reports/allocation-summary` | Allocations by department |
| GET | `/api/reports/booking-heatmap` | Booking peak hours |

### Notifications
| Method | Route | Description |
|---|---|---|
| GET | `/api/notifications` | User notifications |
| PUT | `/api/notifications/:id/read` | Mark one read |
| PUT | `/api/notifications/read-all` | Mark all read |
| GET | `/api/notifications/activity-logs` | Activity log (Admin/AssetManager) |

Health check: `GET /api/health`

---

## Project Status

> **Hackathon build in progress** — incremental commits pushed throughout the event.

| Module | Status |
|---|---|
| Authentication & roles | ✅ Implemented |
| Organization setup | ✅ Implemented |
| Asset registration & directory | ✅ Implemented |
| Allocation & transfer | ✅ Implemented |
| Resource booking | ✅ Implemented |
| Maintenance workflow | ✅ Implemented |
| Asset audit | ✅ Implemented |
| Reports & analytics | ✅ Implemented |
| Notifications & activity logs | ✅ Implemented |

---

## License

TBD — Hackathon project.
