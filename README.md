<div align="center">

# 🚀 WorkForce360

### Workforce • Payroll • Contracts • Invoicing • Expense Management Platform

Transforming staffing agency operations through workforce automation, payroll intelligence, contract management, invoice generation, and business analytics.

<br>

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-22-green?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express.js-Backend-lightgrey?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?style=for-the-badge&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Storage-blue?style=for-the-badge&logo=cloudinary)
![Vercel](https://img.shields.io/badge/Vercel-Frontend-black?style=for-the-badge&logo=vercel)
![Render](https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge)

<br>

**Built for Staffing Agencies, Workforce Contractors, Payroll Teams & Business Operations**

</div>

---

# 📖 Overview

WorkForce360 is a modern workforce management platform specifically designed for staffing agencies and manpower supply companies.

The platform centralizes employee management, attendance tracking, payroll processing, contract administration, invoice generation, expense monitoring, document management, and business reporting into a single digital ecosystem.

Instead of relying on spreadsheets and manual calculations, WorkForce360 automates complex payroll operations, statutory deductions, employer contributions, GST invoicing, and financial reporting while maintaining complete historical records.

---

# ✨ Key Features

## 👥 Employee Management

- Employee Onboarding Wizard
- Employee Profile Management
- Family Information Management
- Educational Details Management
- Employment History Tracking
- Salary Structure Assignment
- Employee Status Management
- Document Storage & Retrieval

---

## 📅 Attendance Management

- Daily Attendance Tracking
- Present / Half-Day / Absent Records
- Overtime Tracking
- Attendance Reports
- Attendance History
- Export Attendance Data

---

## 💰 Payroll Engine

Automated payroll generation based on:

- Fixed Gross Salary
- Basic Salary
- HRA
- Conveyance
- Tea Allowance
- Attendance
- Overtime
- Special Allowance
- PF Deduction
- ESIC Deduction
- Professional Tax

Features:

- Payroll Preview
- Payroll Freeze Mechanism
- Salary Revision Tracking
- Historical Payroll Preservation
- Automated Payslip Generation

---

## 📄 Payslip Management

- PDF Payslip Generation
- Payslip Downloads
- Payroll History
- Historical Salary Records

---

## 🏢 Client Management

- Client Registration
- Contact Information Management
- Client Profiles
- Historical Client Records

---

## 📑 Contract Management

- Contract Creation
- Contract Lifecycle Tracking
- Service Charge Configuration
- GST Configuration
- Contract Status Management

---

## 🧾 Invoice Generation

Automatically generates invoices using:

- Payroll Cost
- Employer Contributions
- Service Charges
- GST Calculations

Features:

- Invoice Preview
- PDF Invoice Generation
- Invoice Freeze Mechanism
- Historical Invoice Preservation

---

## 💸 Expense Management

- Expense Recording
- Expense Categorization
- Expense History
- Expense Analytics

---

## 📊 Reports & Analytics

Generate:

- Attendance Reports
- Payroll Reports
- Invoice Reports
- Revenue Reports
- Expense Reports
- Profit Reports

Export Options:

- PDF
- Excel

---

## 👨‍💼 Worker Self-Service Portal

Workers can:

- View Profile
- View Attendance
- View Salary History
- Download Payslips
- Change Password

---

# 🏗️ System Architecture

```text
                 ┌─────────────────┐
                 │   Admin Portal  │
                 └────────┬────────┘
                          │
                 ┌────────▼────────┐
                 │ Worker Portal   │
                 └────────┬────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │    Next.js Frontend  │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Express.js APIs    │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │      Prisma ORM      │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ PostgreSQL Database  │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │     Cloudinary       │
              │  Document Storage    │
              └──────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

| Technology | Purpose |
|------------|----------|
| Next.js | Application Framework |
| Tailwind CSS | Styling |
| Shadcn/UI | UI Components |
| Axios | API Communication |
| Recharts | Analytics & Dashboards |

## Backend

| Technology | Purpose |
|------------|----------|
| Node.js | Runtime |
| Express.js | REST APIs |
| Prisma ORM | Database ORM |
| JWT | Authentication |
| bcrypt | Password Security |

## Database

| Technology | Purpose |
|------------|----------|
| PostgreSQL | Primary Database |
| Supabase | Database Hosting |

## Storage

| Technology | Purpose |
|------------|----------|
| Cloudinary | Document Storage |

## Reporting

| Technology | Purpose |
|------------|----------|
| Puppeteer | PDF Generation |
| ExcelJS | Excel Exports |

---

# 📂 Project Structure

```text
workforce360/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── lib/
│   └── types/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── modules/
│   │   ├── utils/
│   │   └── prisma/
│   │
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
│
├── docs/
│
└── README.md
```

---

# 🔐 Security Features

- JWT Authentication
- Role-Based Access Control
- bcrypt Password Hashing
- Route Protection
- Input Validation
- Request Sanitization
- Secure File Uploads
- HTTPS Deployment
- Environment Variable Protection

---

# 📈 Performance Targets

| Metric | Target |
|----------|---------|
| Dashboard Load Time | < 3 Seconds |
| API Response Time | < 500 ms |
| Payroll Generation | < 30 Seconds |
| Invoice Generation | < 15 Seconds |

Supported Scale:

- 500+ Employees
- 100+ Contracts
- Multiple Clients
- Multi-Year Payroll History

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/workforce360.git

cd workforce360
```

## Install Frontend

```bash
cd frontend

npm install
```

## Install Backend

```bash
cd backend

npm install
```

## Configure Environment Variables

```env
DATABASE_URL=

JWT_SECRET=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=

NODE_ENV=production
```

## Database Setup

```bash
npx prisma migrate dev

npx prisma generate
```

## Run Backend

```bash
npm run dev
```

## Run Frontend

```bash
npm run dev
```

---

# 📸 Screenshots

## Login Page

![Login](docs/screenshots/login.png)

## Admin Dashboard

![Dashboard](docs/screenshots/dashboard.png)

## Employee Management

![Employees](docs/screenshots/employees.png)

## Payroll Module

![Payroll](docs/screenshots/payroll.png)

## Invoice Generation

![Invoices](docs/screenshots/invoices.png)

---

# 🗺️ Development Roadmap

## MVP

- [x] Authentication
- [x] Employee Management
- [x] Document Management
- [x] Attendance Tracking
- [x] Payroll Engine
- [x] Payslip Generation
- [x] Client Management
- [x] Contract Management
- [x] Invoice Generation
- [x] Expense Management
- [x] Reports & Analytics
- [x] Settings Management
- [x] Deployment

---

# 🔮 Future Enhancements

- Mobile Application
- QR Attendance
- Biometric Attendance
- SMS Notifications
- Email Notifications
- Leave Management
- Multi-Admin Support
- Client Portal
- AI Workforce Insights
- Advanced Analytics
- Automated Tax Reports

---

# 🎯 Business Impact

WorkForce360 helps staffing agencies:

✅ Reduce Payroll Processing Time by 80%

✅ Reduce Invoice Generation Time by 80%

✅ Eliminate Manual Calculation Errors

✅ Centralize Workforce Data

✅ Improve Financial Visibility

✅ Preserve Historical Payroll & Invoice Records

✅ Automate Workforce Operations

---

# 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

Fork the repository and create a pull request with your proposed changes.

---

# 📜 License

This project is licensed under the MIT License.

---

<div align="center">

### WorkForce360

Modern Workforce Management for Staffing Agencies

Built with ❤️ using Next.js, Express.js, PostgreSQL & Prisma

</div>
