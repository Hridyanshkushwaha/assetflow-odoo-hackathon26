# AssetFlow - Enterprise Asset & Resource Management System
**Odoo Hackathon 2026 · Problem Statement PS-01**

> Submission for enterprise asset & resource management — track, allocate, book, maintain, and audit organizational assets without spreadsheets or accounting complexity.

---

## 📋 Table of Contents

- [Vision & Mission](#vision--mission)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [User Roles & Permissions](#user-roles--permissions)
- [Asset Lifecycle](#asset-lifecycle)
- [Workflow Examples](#workflow-examples)
- [Project Status](#project-status)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Vision & Mission

### Vision
AssetFlow digitizes asset and resource management for any organization that owns equipment, furniture, vehicles, or shared spaces—offices, schools, hospitals, factories, agencies, and more.

The platform eliminates manual tracking inefficiencies by enabling:
- ✅ Structured asset lifecycles with state management
- ✅ Centralized resource booking with conflict prevention
- ✅ Real-time visibility into **who holds what**, **where it is**, and **its condition**
- ✅ Role-based workflows for secure, scalable operations

### Mission
Build a user-centric, responsive application that empowers staff with intuitive tools to:
- Set up departments, asset categories, and maintain the employee directory
- Register and track assets through their full lifecycle
- Allocate assets to employees/departments with intelligent conflict handling
- Book shared resources (rooms, vehicles, equipment) without overlaps
- Execute structured maintenance approval workflows
- Run organized audit cycles to catch and resolve discrepancies
- Receive timely notifications for overdue returns, bookings, and maintenance events

---

## ❓ Problem Statement

Organizations face critical challenges without a unified asset management system:

| Challenge | Impact | AssetFlow Solution |
|-----------|--------|-------------------|
| **Fragmented Data** | Assets tracked across spreadsheets and paper logs | Centralized database with real-time visibility |
| **Double Allocation** | Same asset allocated to multiple people/departments | Intelligent conflict detection and transfer requests |
| **Resource Conflicts** | Meetings/vehicles booked simultaneously in multiple slots | Calendar-based overlap validation |
| **Maintenance Delays** | No structured workflow; repairs lost in email threads | Approval-based workflow with status tracking |
| **Audit Inefficiency** | Manual physical counts; discrepancies found too late | Automated audit cycles with digital verification |
| **Poor Visibility** | No dashboard; hard to find assets or spot overdue returns | KPI dashboard with real-time alerts |

---

## ✨ Key Features

### 1. **Authentication & Authorization**
- Email and password-based authentication
- Forgot password / reset password (`/forgot-password`, `/reset-password`; dev mode shows reset link without email SMTP)
- JWT-based session management with secure token validation
- Role-based access control (Admin, Asset Manager, Department Head, Employee)
- Signup creates **Employee** only — first user in an empty database becomes Admin; role promotion is Admin-only via Organization Setup

### 2. **Dashboard & Analytics**
- **KPI Cards:** Assets Available, Assets Allocated, **Maintenance Today**, Active Bookings, Pending Transfers, Upcoming Returns
- **Overdue vs upcoming:** Separate lists plus banner for overdue returns
- **Quick Actions:** Register Asset, Book Resource, Raise Maintenance Request

### 3. **Organization Setup** *(Admin-only)*
- **Department Management:** Create/edit/deactivate departments with optional hierarchy
- **Category Management:** Define asset categories with custom fields (e.g., warranty for Electronics)
- **Employee Directory:** View all employees, manage departments, promote roles

### 4. **Asset Lifecycle Management**
- **Registration:** Name, Category, Auto-generated Asset Tag (e.g., `AF-0001`), Serial Number, Acquisition Date, Condition, Location, Photo/Documents
- **Directory:** Search and filter by Asset Tag, Serial Number, QR code, category, status, department, or location
- **Status Tracking:** Available → Allocated → Under Maintenance → Returned → Available
- **History:** Complete audit trail of allocation and maintenance events per asset

### 5. **Asset Allocation & Transfer**
- Allocate assets to employees/departments with optional expected return dates
- **Conflict Prevention:** System blocks double-allocation and suggests transfer requests
- **Transfer Workflow:** Requested → Approved (Asset Manager/Department Head) → Re-allocated
- **Return Flow:** Mark returned, capture condition notes, status reverts to Available
- **Overdue Alerts:** Automatic flagging and notification for late returns

### 6. **Resource Booking**
- Calendar-based booking interface for shared resources
- **Overlap Validation:** Rejects overlapping time slots (e.g., 9:00–10:00 blocks 9:30–10:30)
- **Booking States:** Upcoming, Ongoing, Completed, Cancelled
- **Cancel** upcoming bookings; conflict preview on the calendar before confirm

### 7. **Maintenance Management**
- Raise requests with asset selection, issue description, priority, and optional photo (multipart upload)
- **Approval Workflow:** Pending → Approved/Rejected → Technician Assigned → In Progress → Resolved
- **Automatic Status:** Asset marked as "Under Maintenance" on approval; reverts to "Available" on resolution
- **History:** Full maintenance event log retained per asset

### 8. **Asset Audits**
- Create audit cycles with scope (department/location), date range, and assigned auditors
- **Auditor Tasks:** Mark each asset as Verified, Missing, or Damaged
- **Discrepancy Reports:** Auto-generated for flagged items
- **Cycle Management:** Close cycle to lock and update statuses (e.g., Missing → Lost)
- **Audit History:** Complete record of all audits and their findings

### 9. **Reports & Business Intelligence**
- Asset utilization trends and idle asset identification
- Maintenance frequency analysis by asset and category
- Assets due for maintenance or retirement
- Department-wise allocation summaries
- Resource booking heatmaps showing peak usage windows
- Exportable reports for stakeholder communication

### 10. **Activity Logs & Notifications**
- **In-App Notifications:** Asset Assigned, Maintenance Approved/Rejected, Booking Confirmed/Cancelled/Reminder, Transfer Approved, Overdue Return Alert, Audit Discrepancy Flagged
- **Activity Logs:** Complete audit trail of all actions (who, what, when) for compliance and troubleshooting

---

## 🏗️ System Architecture

### High-Level Data Flow
```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  Dashboard | Asset Registry | Allocations | Bookings | Audits│
└──────────────────────────┬──────────────────────────────────┘
                           │ (Axios API Calls)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Node.js + Express)                 │
│  ┌───────────┬──────────┬──────────┬──────────┬────────────┐│
│  │ Auth      │ Assets   │ Alloc.   │ Booking  │ Maintenance││
│  │ Dept/Cats │ Transfers│ Audits   │ Reports  │ Notif.    ││
│  └───────────┴──────────┴──────────┴──────────┴────────────┘│
└──────────────────────────┬──────────────────────────────────┘
                           │ (Mongoose ORM)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│        Database (MongoDB Atlas)                               │
│  Users | Assets | Allocations | Bookings | Maintenance      │
│  Audits | Notifications | ActivityLogs | Departments        │
└─────────────────────────────────────────────────────────────┘
```

### Request-Response Pattern
1. Frontend sends HTTP request (with JWT token in Authorization header)
2. Middleware validates JWT and attaches user context
3. Route handler calls appropriate controller
4. Controller executes business logic + database queries
5. Controller returns JSON response
6. Frontend updates state and re-renders UI

### Async Jobs
- **Overdue Checker:** Runs on dashboard load and hourly — flags overdue allocations, advances booking statuses, stale maintenance alerts

---

## 💻 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18.3 | UI library and component framework |
| **Frontend Bundler** | Vite 5.4 | Fast development server and build tool |
| **Frontend Router** | React Router 6.26 | Client-side routing and navigation |
| **Frontend Styling** | Tailwind CSS 3.4 | Utility-first CSS framework |
| **HTTP Client** | Axios 1.7 | Promise-based API requests |
| **Backend Runtime** | Node.js 18+ | JavaScript runtime |
| **Backend Framework** | Express.js 4.21 | Lightweight web framework |
| **Database** | MongoDB Atlas | NoSQL document database |
| **ODM** | Mongoose 8.7 | MongoDB object data modeling |
| **Authentication** | JWT + bcryptjs | Token-based auth with secure password hashing |
| **File Upload** | Multer 1.4 | Middleware for form-data file uploads |
| **CORS** | cors 2.8 | Cross-Origin Resource Sharing |
| **Environment** | dotenv 16.4 | Environment variable management |

### Why This Stack?
- **React + Vite:** Fast development, modern syntax (ES6+), component reusability, excellent DevX
- **Express.js:** Lightweight, modular, large ecosystem, perfect for ERP APIs
- **MongoDB:** Flexible schema ideal for evolving asset attributes; easy horizontal scaling
- **Mongoose:** Schema validation, middleware hooks, rich query API
- **JWT:** Stateless authentication; scales horizontally without session storage

---

## 📁 Project Structure

```
assetflow/                           # clone folder (repo: assetflow-odoo-hackathon26)
│
├── backend/                          # Express.js API Server
│   ├── scripts/
│   │   └── feature-test.mjs         # API integration smoke tests
│   ├── src/
│   │   ├── server.js                # Main Express app setup & MongoDB connection
│   │   ├── models/                  # Mongoose schemas (User, Asset, Allocation, …)
│   │   ├── controllers/             # Business logic (auth, assets, allocations, …)
│   │   ├── routes/                  # Express route handlers
│   │   ├── middleware/              # JWT auth, Multer uploads
│   │   ├── utils/                   # generateAssetTag, overdueChecker, bookingOverlap, …
│   │   └── constants/               # businessRules.js (roles, error codes)
│   ├── uploads/                     # Local file storage for asset/maintenance photos
│   ├── .env.example
│   └── package.json
│
├── frontend/                        # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx                  # Routes + protected layout
│   │   ├── pages/                   # Login, Dashboard, Assets, Allocations, …
│   │   ├── components/              # Layout, Sidebar, AppHeader, Card, DataTable, …
│   │   ├── config/branding.js       # VITE_ORG_NAME (organization header label)
│   │   ├── context/AuthContext.jsx
│   │   ├── services/api.js          # Axios client (JWT injection)
│   │   └── utils/                   # navigation.js, roles.js
│   ├── tailwind.config.js
│   └── vite.config.js               # Proxies /api and /uploads → :5000
│
├── .gitignore
└── README.md
```

> Full tree: 10 frontend screens map 1:1 to PS-01 (Login/Signup, Dashboard, Organization Setup, Assets, Allocations, Bookings, Maintenance, Audits, Reports, Notifications).

### Key Design Decisions
- **Separation of Concerns:** Controllers handle business logic, routes handle HTTP mapping, models define schemas
- **Middleware:** Auth middleware validates JWT before processing requests
- **Utilities:** Shared logic (e.g., asset tag generation, overdue detection) in `/utils`
- **Context API:** Auth state managed globally via React Context; no Redux needed for MVP
- **Tailwind CSS:** Utility-first approach ensures consistent, responsive design without custom CSS overhead

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** Version 18 or higher
- **npm:** Version 9 or higher (bundled with Node.js)
- **MongoDB:** Atlas cluster (free tier available) or local MongoDB instance
- **Git:** For cloning the repository

### 1. Clone the Repository
```bash
git clone https://github.com/Hridyanshkushwaha/assetflow-odoo-hackathon26.git
cd assetflow-odoo-hackathon26
```

### 2. Backend Setup

#### 2.1 Navigate to Backend Directory
```bash
cd backend
```

#### 2.2 Install Dependencies
```bash
npm install
```

#### 2.3 Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your configuration (see `backend/.env.example`):
```env
MONGO_URI=mongodb://username:password@host1:27017,host2:27017/assetflow?ssl=true&authSource=admin&retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
PORT=5000
```

**Windows note:** If `mongodb+srv://` fails with `querySrv ECONNREFUSED`, use the standard `mongodb://` connection string from Atlas (Connect → Drivers).

**Where to get MONGO_URI:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create/login to your account
3. Create a cluster or use existing one
4. Click "Connect" → "Drivers" → Copy the connection string
5. Replace `<username>`, `<password>`, and `<dbname>` in the URI

#### 2.4 Start the Backend Server
```bash
npm run dev
```

Expected output:
```
MongoDB connected
AssetFlow API running on port 5000
```

✅ Backend is running at **http://localhost:5000**

### 3. Frontend Setup

#### 3.1 Open a New Terminal and Navigate to Frontend
```bash
cd frontend
```

#### 3.2 Install Dependencies
```bash
npm install
```

#### 3.3 Optional: Organization name in header
Create `frontend/.env` (optional):
```env
VITE_ORG_NAME=Your Organization Name
```
Defaults to `NovaTech Industries` if unset. Restart Vite after changing.

#### 3.4 Start the Development Server
```bash
npm run dev
```

Expected output:
```
VITE v5.4.8  ready in XXX ms

Local:    http://localhost:5173/
```

✅ Frontend is running at **http://localhost:5173**

### 4. First-Time Usage

#### 4.1 Sign Up
- Navigate to **http://localhost:5173**
- Click "Sign Up"
- Enter email and password
- **First registered user automatically becomes Admin**
- Log in with your credentials

#### 4.2 Admin Setup
- Navigate to **Organization Setup** tab
- Create departments (e.g., IT, HR, Finance)
- Create asset categories (e.g., Electronics, Furniture, Vehicles)
- Promote employees to Department Head or Asset Manager as needed

#### 4.3 Asset Manager Registers Assets
- Navigate to **Assets**
- Click "Register Asset"
- Fill in asset details (name, category, serial number, etc.)
- Asset gets auto-generated tag (e.g., AF-0001)

#### 4.4 Allocate and Book
- Allocate assets to employees/departments from the **Allocations** page
- Book shared resources from the **Bookings** page
- Raise maintenance requests from the **Maintenance** page

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require `Authorization: Bearer <token>`. Public: `/auth/signup`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`.

### Endpoints

#### **Authentication**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register (Employee; first user → Admin). Rejects `role` in body |
| POST | `/auth/login` | Login and receive JWT token |
| POST | `/auth/forgot-password` | Request password reset token |
| POST | `/auth/reset-password` | Set new password with token |
| GET | `/auth/me` | Get current user info (requires JWT) |

#### **Organization**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/departments` | List all departments |
| POST | `/departments` | Create department (Admin only) |
| PUT | `/departments/:id` | Update department (Admin only) |
| GET | `/categories` | List all asset categories |
| POST | `/categories` | Create category (Admin only) |
| PUT | `/categories/:id` | Update category (Admin only) |
| GET | `/users` | List all users |
| PUT | `/users/:id` | Update user (Admin can change role, department, status) |

#### **Assets**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/assets` | List all assets (with filters: status, category, department, location) |
| POST | `/assets` | Register new asset (AssetManager+) |
| PUT | `/assets/:id` | Update asset details |
| GET | `/assets/:id` | Get single asset details |
| GET | `/assets/:id/history` | Get allocation + maintenance history for asset |
| GET | `/assets/bookable` | List assets marked as bookable resources |

#### **Allocations & Transfers**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/allocations` | List all allocations |
| POST | `/allocations` | Create new allocation |
| POST | `/allocations/:id/return` | Return an allocated asset (capture condition notes) |
| GET | `/transfers` | List transfer requests |
| POST | `/transfers` | Request transfer (if asset already allocated) |
| POST | `/transfers/:id/approve` | Approve or reject transfer (AssetManager/DeptHead) |

#### **Bookings**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bookings` | List all bookings (with filters: resource, user, status) |
| POST | `/bookings` | Create new booking (validates no overlap) |
| POST | `/bookings/:id/cancel` | Cancel an upcoming booking |
| GET | `/bookings/calendar/:resourceId` | Get calendar view of bookings for a resource |

#### **Maintenance**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/maintenance` | List all maintenance requests |
| POST | `/maintenance` | Raise new maintenance request |
| POST | `/maintenance/:id/approve` | Approve or reject (Asset Manager) |
| POST | `/maintenance/:id/assign-technician` | Assign technician → Technician Assigned |
| POST | `/maintenance/:id/start` | Move to In Progress |
| POST | `/maintenance/:id/resolve` | Mark resolved (asset → Available) |

#### **Audits**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/audits` | List audit cycles |
| POST | `/audits` | Create new audit cycle (Admin; specify scope and auditors) |
| GET | `/audits/:id` | Get cycle details + items to audit |
| POST | `/audits/:id/items` | Submit audit result for an item (Verified/Missing/Damaged) |
| POST | `/audits/:id/close` | Close audit cycle (locks, updates statuses) |
| GET | `/audits/:id/discrepancies` | Get auto-generated discrepancy report |

#### **Dashboard & Reports**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/kpis` | KPI dashboard: available assets, allocations, maintenance today, etc. |
| GET | `/reports/utilization` | Asset utilization trends + idle asset identification |
| GET | `/reports/maintenance-frequency` | Maintenance count by category |
| GET | `/reports/allocation-summary` | Allocations by department |
| GET | `/reports/booking-heatmap` | Resource booking peak hours + most-used assets |
| GET | `/reports/maintenance-alerts` | Pending maintenance + aging assets |

#### **Notifications**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get user's notifications |
| PUT | `/notifications/:id/read` | Mark single notification as read |
| PUT | `/notifications/read-all` | Mark all notifications as read |
| GET | `/notifications/activity-logs` | Get activity log (Admin/AssetManager only) |

#### **Health Check**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check API status |

---

## 👥 User Roles & Permissions

| Role | Responsibilities | Permissions |
|------|-----------------|-------------|
| **Admin** | System setup, organization configuration, user management | Create departments/categories, promote users, view analytics, manage all audits |
| **Asset Manager** | Asset registration, allocation approval, maintenance approval | Register assets, approve transfers, approve maintenance, assign technicians, close audits |
| **Department Head** | Department asset management, resource booking for department | View dept assets, approve transfers within dept, book resources, raise maintenance |
| **Employee** | Daily asset and resource usage | View assigned assets, book resources, raise maintenance requests, return assets |

### Role Assignment Rule
- **Signup:** All new users default to **Employee** role
- **Promotion:** Only Admin can promote Employee → Department Head or Asset Manager
- **No Self-Assignment:** Users cannot select roles during signup

---

## 🔄 Asset Lifecycle

AssetFlow defines seven asset states with valid transitions:

```
Available  ←→  Under Maintenance
   ↓              ↑
Allocated   →   Reserved
   ↓
Retired / Disposed → Lost
```

| State | Description | Possible Actions |
|-------|-------------|-----------------|
| **Available** | Ready for allocation or booking | Allocate, Book, Schedule Maintenance |
| **Allocated** | Assigned to employee/department | Return, Transfer, Request Maintenance |
| **Reserved** | Held for pending allocation/transfer | Allocate, Cancel Reservation |
| **Under Maintenance** | In repair (automatic on maintenance approval) | Resolve, Extend (reschedule) |
| **Lost** | Confirmed missing via audit | Retire, Dispose |
| **Retired** | No longer in active use | Dispose (permanent removal) |
| **Disposed** | Permanently removed from inventory | *(End state—no further actions)* |

### Example Transition Flow
```
1. Asset registered → Available
2. Allocated to John → Allocated
3. John requests maintenance → Under Maintenance (automatic)
4. Technician fixes it → Available (after resolution)
5. John returns it → Available
6. John requests again → Allocated
7. Audit marks it as lost → Lost
8. Admin disposes of it → Disposed
```

---

## 🔁 Workflow Examples

### Example 1: Asset Allocation with Conflict Handling
```
Scenario: Manager tries to allocate an already-allocated asset

Step 1: Manager navigates to Allocations, clicks "Allocate Asset"
Step 2: System shows: "Laptop #AF-0001 is currently held by John Smith (until 2026-07-31)"
Step 3: Manager clicks "Request Transfer"
Step 4: Transfer request created with status "Pending"
Step 5: Asset Manager notified
Step 6: Asset Manager reviews and approves transfer
Step 7: Asset re-allocated to Manager; John notified to return it
Step 8: John marks asset as returned → Status back to "Available"
Step 9: Manager can now use the asset

Result: Zero downtime; clear audit trail; all stakeholders notified
```

### Example 2: Resource Booking with Overlap Validation
```
Scenario: Employee books a conference room

Step 1: Employee navigates to Bookings, selects Conference Room A
Step 2: Calendar shows existing bookings (9:00–10:00 AM, 2:00–3:00 PM)
Step 3: Employee tries to book 9:30–10:30 AM
Step 4: System rejects: "Overlaps with existing booking 9:00–10:00 AM"
Step 5: Employee books 10:00–11:00 AM instead (no overlap)
Step 6: System accepts and confirms booking

Result: No double-bookings; smooth resource utilization
```

### Example 3: Maintenance Approval Workflow
```
Scenario: Employee raises maintenance request for a printer

Step 1: Employee navigates to Maintenance, clicks "Raise Request"
Step 2: Fills in: Printer #AF-0123, Issue: "Paper jam frequently", Priority: High
Step 3: Attaches photo of the error message
Step 4: Request created with status "Pending"
Step 5: Asset Manager notified of pending request
Step 6: Asset Manager reviews and approves
Step 7: Asset status automatically → "Under Maintenance"
Step 8: Technician assigned and notified
Step 9: Technician marks as "In Progress"
Step 10: After repair, technician clicks "Resolve"
Step 11: Asset status automatically → "Available"
Step 12: Employee and manager notified

Result: Structured workflow; clear escalation paths; no lost requests
```

### Example 4: Audit Cycle Execution
```
Scenario: Admin runs quarterly audit for IT department

Step 1: Admin navigates to Audits, clicks "Create Audit Cycle"
Step 2: Specifies: Department: IT, Date Range: Q3 2026, Auditors: 2 people
Step 3: System generates audit items for all IT department assets
Step 4: Auditors notified with audit assignment
Step 5: Auditors scan QR codes and mark each asset:
         - "Verified" if physically present and in good condition
         - "Damaged" if present but needs repair
         - "Missing" if not found
Step 6: Auditor uploads photos for damaged items
Step 7: Admin closes audit cycle
Step 8: System auto-generates discrepancy report:
         - 95 verified, 3 damaged, 2 missing
         - Missing assets marked as "Lost"
         - Damaged assets marked for maintenance
Step 9: Report exported for stakeholder review

Result: Accurate inventory; auto-flagged discrepancies; full accountability
```

---

## 📊 Project Status

> **Status:** Hackathon submission for Odoo Hackathon 2026 PS-01 — core PS-01 screens and business rules implemented.

### Implementation Checklist

| Module | Status | Notes |
|--------|--------|-------|
| Authentication & Roles | ✅ Implemented | JWT-based with bcrypt hashing |
| Organization Setup | ✅ Implemented | Departments, categories, employee directory |
| Asset Registration & Directory | ✅ Implemented | Full CRUD with search/filter |
| Asset Lifecycle States | ✅ Implemented | 7 states with valid transitions |
| Allocation & Transfer | ✅ Implemented | Conflict detection + transfer workflow |
| Resource Booking | ✅ Implemented | Calendar + overlap validation |
| Maintenance Workflow | ✅ Implemented | Approval-based with technician assignment |
| Asset Audits | ✅ Implemented | Cycle creation, item verification, discrepancy reports |
| Reports & Analytics | ✅ Implemented | Utilization, maintenance frequency, allocation summary, booking heatmap |
| Notifications & Activity Logs | ✅ Implemented | In-app notifications + complete audit trail |
| Dashboard & KPIs | ✅ Implemented | Maintenance Today KPI, overdue/upcoming lists, quick actions |
| Forgot / Reset Password | ✅ Implemented | Token-based; dev mode reset link (no SMTP) |
| File Uploads | ✅ Implemented | Asset photos, maintenance request attachments |
| Overdue Detection | ✅ Implemented | Hourly background check + notifications |

### Known Limitations (Out of Scope / Partial)
- ❌ Purchasing / Procurement module
- ❌ Invoicing / Financial integration
- ❌ Multi-tenancy (single organization per deployment)
- ❌ Email notifications (in-app only; password reset uses dev reset link)
- ⚠️ Booking reschedule & pre-slot reminder notifications — not implemented
- ⚠️ QR code field — search UI placeholder only (tag/serial/name search works)
- ⚠️ Department-scoped audit cycles need assets allocated to that department to populate items

---

## 🛠️ Development Guide

### Frontend Development
```bash
cd frontend
npm run dev          # Start Vite dev server on localhost:5173
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Backend Development
```bash
cd backend
npm run dev          # Start with auto-reload (node --watch)
npm start            # Production
node scripts/feature-test.mjs   # API smoke tests (server must be running)
```

### Adding a New Feature

#### Backend
1. Create model in `src/models/` (if needed)
2. Create route in `src/routes/`
3. Create controller in `src/controllers/`
4. Update `src/server.js` to import and mount the new route

#### Frontend
1. Create page component in `src/pages/` (if new screen)
2. Use `src/services/api.js` for API calls
3. Add route in `src/App.jsx` and nav entry in `src/utils/navigation.js` (role-gated)

### Debugging
- **Backend:** Check logs in terminal; MongoDB Atlas can view documents directly
- **Frontend:** Use React DevTools browser extension; check network tab for API calls

---

## 🤝 Contributing

This is a hackathon project. Contributions are welcome!

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- **JavaScript:** ES6+, use `const`/`let`, avoid `var`
- **React:** Functional components with hooks, JSX formatting via Prettier
- **Backend:** Consistent error handling, meaningful variable names, comments for complex logic

---

## 📄 License

TBD — Hackathon project. License to be determined after the event.

---

## 📞 Support

### Troubleshooting

**MongoDB Connection Error**
- Check `MONGO_URI` in `.env`
- Ensure MongoDB Atlas network access allows your IP
- Verify username/password are correct

**Frontend Can't Connect to Backend**
- Ensure backend is running on port 5000
- Check browser console for CORS errors
- Verify Vite proxy config in `vite.config.js`

**Asset Tag Not Auto-Generating**
- Check `backend/src/utils/generateAssetTag.js`
- Verify database connection
- Restart backend server

### Contact
For questions or issues, please open a GitHub issue or contact the maintainers.

---

## 🎉 Acknowledgments

Built for **Odoo Hackathon 2026 Problem Statement PS-01** with ❤️ by the AssetFlow team.

Special thanks to:
- Odoo for hosting the hackathon
- MongoDB for the Atlas free tier
- React and Node.js communities for amazing tools

---

**Happy Managing! 🚀**
