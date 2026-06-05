# WorkForce360

## Workforce, Payroll, Contract, Invoice & Expense Management Platform

WorkForce360 is a comprehensive workforce management solution designed specifically for staffing agencies and manpower supply companies. The platform centralizes employee administration, attendance tracking, payroll processing, client contract management, invoice generation, expense management, document storage, and business reporting into a single web-based application.

The system eliminates manual spreadsheets and paperwork by automating payroll calculations, statutory deductions, employer contributions, invoice generation, and reporting workflows.

---

## Project Overview

WorkForce360 provides:

* Employee Onboarding & Management
* Attendance & Overtime Tracking
* Automated Payroll Processing
* Payslip Generation
* Client & Contract Management
* Automated Invoice Generation
* Expense Tracking
* Business Reports & Analytics
* Employee Document Management
* Worker Self-Service Portal
* Role-Based Access Control

---

## Key Features

### Authentication & Access Management

* Secure Login System
* JWT Authentication
* Role-Based Authorization
* Password Change Functionality
* Admin Password Reset
* Protected Routes

### Employee Management

* Employee Onboarding Wizard
* Personal Information
* Family Information
* Educational Details
* Employment History
* Salary Structure Management
* Status Tracking
* Employee Profile Management

### Document Management

Secure storage and retrieval of:

* Employee Photograph
* Aadhaar Card
* PAN Card
* Bank Passbook
* Joining Form
* PF Documents
* ESIC Documents

### Attendance Management

* Daily Attendance Recording
* Present / Half Day / Absent Tracking
* Overtime Recording
* Monthly Attendance Summary
* Attendance Reports
* Attendance Export

### Payroll Management

Automated payroll processing based on:

* Fixed Gross Salary
* Basic Salary
* HRA
* Conveyance
* Tea Allowance
* Attendance
* Overtime
* Special Allowance
* PF
* ESIC
* Professional Tax

Features:

* Monthly Payroll Generation
* Payroll Preview
* Payroll Freeze Mechanism
* Salary Revision Tracking
* Historical Payroll Preservation

### Payslip Management

* Auto Generated Payslips
* PDF Download
* Historical Payslip Access
* Payroll Snapshot Preservation

### Client Management

* Client Registration
* Client Profile Management
* Contact Information Storage
* Historical Client Records

### Contract Management

* Contract Creation
* Service Charge Configuration
* GST Configuration
* Contract Lifecycle Tracking

### Invoice Management

Automated invoice generation including:

* Payroll Cost
* Employer Contributions
* Service Charges
* GST Calculations

Features:

* Invoice Preview
* Invoice Freeze Mechanism
* PDF Export
* Historical Invoice Preservation

### Expense Management

* Expense Recording
* Expense Categorization
* Expense Reporting
* Expense History

### Reports & Analytics

Available Reports:

* Attendance Reports
* Payroll Reports
* Invoice Reports
* Revenue Reports
* Expense Reports
* Profit Reports

Export Formats:

* PDF
* Excel

### Worker Self-Service Portal

Workers can:

* View Profile
* View Attendance
* View Payroll History
* Download Payslips
* Change Password

---

## User Roles

### Admin

Admin has complete access to:

* Employees
* Attendance
* Payroll
* Payslips
* Clients
* Contracts
* Invoices
* Expenses
* Reports
* Settings

### Worker

Worker can:

* View Own Profile
* View Own Attendance
* View Own Payroll
* Download Own Payslips
* Change Password

Workers cannot modify business records.

---

## System Architecture

```text
Admin / Worker
       │
       ▼
Next.js Frontend
       │
       ▼
REST API Layer
 (Express.js)
       │
       ▼
 Prisma ORM
       │
       ▼
 PostgreSQL
       │
       ▼
 Cloudinary
```

Architecture Pattern:

* Monolithic Modular Architecture

---

## Technology Stack

### Frontend

| Technology   | Purpose            |
| ------------ | ------------------ |
| Next.js      | Frontend Framework |
| Tailwind CSS | Styling            |
| Shadcn/UI    | UI Components      |
| Axios        | API Communication  |
| Recharts     | Analytics & Graphs |

### Backend

| Technology | Purpose           |
| ---------- | ----------------- |
| Node.js    | Runtime           |
| Express.js | REST APIs         |
| Prisma ORM | Database Access   |
| JWT        | Authentication    |
| bcrypt     | Password Security |

### Database

| Technology | Purpose          |
| ---------- | ---------------- |
| PostgreSQL | Primary Database |
| Supabase   | Managed Hosting  |

### Storage

| Technology | Purpose          |
| ---------- | ---------------- |
| Cloudinary | Document Storage |

### Reporting

| Technology | Purpose        |
| ---------- | -------------- |
| Puppeteer  | PDF Generation |
| ExcelJS    | Excel Exports  |

### Deployment

| Service    | Purpose            |
| ---------- | ------------------ |
| Vercel     | Frontend Hosting   |
| Render     | Backend Hosting    |
| Supabase   | PostgreSQL Hosting |
| Cloudinary | File Storage       |

---

## Project Structure

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
│   │   ├── modules/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── prisma/
│   │   └── utils/
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

## Database Modules

### Authentication

* Users
* User Sessions

### Employee Management

* Employees
* Family Members
* Education
* Employment History
* Bank Details
* Documents

### Salary Management

* Salary Structures
* Salary Revisions

### Attendance

* Daily Attendance Records

### Payroll

* Payroll Batches
* Payroll Items
* Payslips

### Client Management

* Clients
* Contracts

### Billing

* Invoice Batches
* Invoice Items

### Finance

* Expenses
* Expense Categories

### System

* Settings
* Audit Logs

---

## Payroll Engine

The payroll engine supports:

### Salary Components

* Basic
* HRA
* Conveyance
* Tea Allowance

### Attendance Processing

* Present = 1 Day
* Half Day = 0.5 Day
* Absent = 0 Day

### Overtime Calculation

* Supports 0.5-hour increments
* Configurable OT Limits
* Automatic OT Wage Calculation

### Statutory Calculations

#### PF

* Employee PF
* Employer PF
* PF Admin Charges

#### ESIC

* Employee ESIC
* Employer ESIC

#### Professional Tax

* Configurable Slabs

### Payroll Freeze

After payroll generation:

* No edits allowed
* No regeneration allowed
* Historical payroll remains immutable

---

## Invoice Engine

Invoice calculation includes:

* Payroll Cost
* Employer PF
* PF Admin Charges
* Employer ESIC
* Service Charges
* CGST
* SGST

Invoice features:

* Preview Before Generation
* PDF Generation
* Freeze Mechanism
* Historical Preservation

---

## Security Features

* JWT Authentication
* bcrypt Password Hashing
* Role-Based Access Control
* Route Protection
* Input Validation
* Request Sanitization
* Environment Variable Security
* HTTPS Deployment
* Secure File Uploads

---

## Environment Variables

```env
DATABASE_URL=

JWT_SECRET=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=

NODE_ENV=production
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/workforce360.git

cd workforce360
```

### Install Frontend

```bash
cd frontend

npm install
```

### Install Backend

```bash
cd backend

npm install
```

### Setup Database

```bash
npx prisma migrate dev

npx prisma generate
```

### Start Backend

```bash
npm run dev
```

### Start Frontend

```bash
npm run dev
```

---

## Development Workflow

Recommended implementation order:

1. Authentication
2. Employee Management
3. Document Management
4. Attendance
5. Payroll
6. Payslips
7. Clients
8. Contracts
9. Invoices
10. Expenses
11. Reports
12. Settings
13. Testing
14. Deployment

---

## Performance Targets

* Dashboard Load Time < 3 Seconds
* API Response Time < 500ms
* Payroll Generation < 30 Seconds
* Invoice Generation < 15 Seconds

Supported Scale:

* 500+ Employees
* 100+ Contracts
* Multiple Clients
* 5+ Years Historical Payroll Data

---

## Future Enhancements

* Mobile Application
* SMS Notifications
* Email Notifications
* QR Attendance
* Biometric Integration
* Leave Management
* Multi-Admin Support
* Client Portal
* AI Workforce Insights
* Advanced Financial Analytics
* Cloud Backup Automation

---

## MVP Status

### Completed Modules

* Authentication
* Employee Management
* Document Management
* Attendance Management
* Payroll Engine
* Payslip Generation
* Client Management
* Contract Management
* Invoice Generation
* Expense Management
* Reports & Analytics
* Settings Management

---

## Business Goal

WorkForce360 transforms manual workforce administration, payroll processing, client billing, and financial reporting into a centralized digital platform that improves operational efficiency, payroll accuracy, business visibility, and record management for staffing agencies.

---

## License

This project is developed as a workforce management solution for staffing agencies.

© 2026 WorkForce360. All Rights Reserved.
