# ManagePortal

A full-stack Management System built with React, Node.js, Express, and MongoDB.

## Features

- **Admin Dashboard** — Employee management, payroll, leave requests, announcements, reports, notifications
- **Employee Dashboard** — My tasks, leaves, payslips, announcements, notifications, profile
- **Authentication** — Email/password login + Google OAuth (Firebase)
- **Role-based Access** — Admin and Employee roles with protected routes
- **Excel Import/Export** — Bulk import employees via `.xlsx`, export as CSV/Excel/PDF
- **Reports** — Payroll trends, department headcount, role distribution, top earners, task stats

## Tech Stack

| Layer     | Tech                                      |
|-----------|-------------------------------------------|
| Frontend  | React 18, React Router v6, Recharts, XLSX |
| Backend   | Node.js, Express.js                       |
| Database  | MongoDB Atlas + Mongoose                  |
| Auth      | JWT + Firebase Google OAuth               |
| Styling   | Custom CSS                                |

## Project Structure

### Frontend (`manage-portal`)

```
src/
├── features/
│   ├── announcements/
│   ├── auth/
│   ├── employees/
│   ├── leaves/
│   ├── notifications/
│   ├── overview/
│   ├── payroll/
│   ├── profile/
│   ├── reports/
│   └── tasks/
├── pages/
├── shared/
│   ├── api/
│   ├── data/
│   ├── firebase/
│   ├── hooks/
│   ├── icons/
│   ├── ui/
│   └── utils/
├── styles/
├── App.jsx
└── main.jsx
```

---

### Backend (`manage-portal-backend`)

```
src/
├── config/
├── middleware/
├── models/
├── routes/
├── seed.js
└── server.js
```


## Getting Started

### Backend Setup

```bash
cd manage-portal-backend
npm install
```

### Create `.env` file

```env
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
PORT=5000
```

Seed database:
```bash
node src/seed.js
```

Start server:
```bash
npm run dev
```

### Frontend Setup

```bash
cd manage-portal
npm install
npm run dev
```

## Demo Credentials

| Role     | Email                        | Password      |
|----------|------------------------------|---------------|
| Admin    | admin@centralpark.in         | Admin@123     |
| Employee | employee@centralpark.in      | Employee@123  |

## API Endpoints

| Method | Route                  | Description              | Access   |
|--------|------------------------|--------------------------|----------|
| POST   | /api/auth/login        | Login                    | Public   |
| GET    | /api/users             | Get all users            | Admin    |
| GET    | /api/users/:id         | Get user by ID           | Auth     |
| PUT    | /api/users/:id         | Update user              | Auth     |
| GET    | /api/leaves            | Get leaves               | Auth     |
| POST   | /api/leaves            | Apply for leave          | Auth     |
| PUT    | /api/leaves/:id        | Approve/reject leave     | Admin    |
| GET    | /api/tasks             | Get tasks                | Auth     |
| POST   | /api/tasks             | Create task              | Auth     |
| GET    | /api/announcements     | Get announcements        | Auth     |
| POST   | /api/announcements     | Post announcement        | Admin    |
| GET    | /api/notifications     | Get notifications        | Auth     |
| GET    | /api/reports           | Get report data          | Admin    |
| GET    | /api/payroll           | Get payroll data         | Auth     |
