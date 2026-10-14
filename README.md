# ChooseBed (choosebed.com) 🛏️

> Modern PG, hostel, and co-living operations platform designed for business owners, residents, and platform administrators.

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## 🌟 Overview

**ChooseBed** (choosebed.com) simplifies end-to-end PG and hostel management. From listing properties and assigning rooms to tracking monthly rent collections and safeguarding operational governance, the platform delivers an intuitive experience for PG owners alongside a centralized administration cockpit.

---

## 🚀 Key Features

### 🏢 1. PG Owner Workspace (`/user`)

- **Interactive Operations**: Dedicated portal for PG & hostel operators.
- **Property Portfolio**: View and manage multi-building properties and branch locations.
- **Room & Bed Allocation**: Track single, double, and triple-sharing room inventories.
- **Resident Management**: Digital records of resident onboardings and contact details.
- **Rent & Dues Tracking**: Keep tab on paid, pending, and overdue room payments.

### 🛡️ 2. Platform Admin Suite (`/admin`)

- **System Overview**: High-level platform health, registered accounts, active properties, and quick administration links.
- **PG Owners Directory**: Searchable directory with setup filters, status indicators (`ACTIVE`, `SUSPENDED`, `IN_REVIEW`), and clean pagination.
- **Properties Monitoring**: Real-time property inventory, room/bed capacity tracking, occupancy rates, and verification status.
- **Activity & Security Audit Trail**: Tamper-evident logging of administrative actions, user suspensions, and security events with actor identities and timestamps.
- **Platform Settings**: Admin profile credentials, strong password rotation, and governance policy enforcement.

### 🔒 3. Enterprise-Grade Security

- **Role-Based Access Control (RBAC)**: Strict segregation between `ADMIN`, `BUSINESS_OWNER`, and `USER` roles.
- **Intelligent Routing**: Automated middleware redirection preventing administrative accounts from landing on owner views.
- **Encrypted Session Management**: JWT session validation with instant status verification.
- **Password Hashing**: Strong bcrypt hashing with salt rounds.

---

## 🛠️ Technology Stack

| Layer                      | Technologies                                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Framework**              | [Next.js 15 (App Router)](https://nextjs.org/)                                                                          |
| **Frontend**               | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/) |
| **Database & ORM**         | [PostgreSQL (Supabase)](https://supabase.com/), [Prisma ORM](https://www.prisma.io/)                                    |
| **Authentication**         | [NextAuth.js](https://next-auth.js.org/) with Prisma Adapter & Credentials Provider                                     |
| **Styling & Assets**       | Custom HSL-tailored forest palette, Satoshi & Outfit Typography, Lucide-style SVGs                                      |
| **Validation & Utilities** | [Zod](https://zod.dev/), [Axios](https://axios-http.com/), [React Hot Toast](https://react-hot-toast.com/)              |
| **Internationalization**   | [next-intl](https://next-intl-docs.vercel.app/) (English, German)                                                       |

---

## 📁 Project Structure

```text
pg-hostel-web/
├── prisma/
│   └── schema.prisma          # Database models (User, Property, AuditLog, etc.)
├── public/
│   ├── favicon.svg            # ChooseBed branded favicon
│   └── images/logo/           # Brand marks, symbols, and dark/light logos
├── src/
│   ├── __tests__/             # Security and regression test suites
│   ├── app/
│   │   ├── (site)/
│   │   │   ├── admin/         # Platform administration routes (Overview, Owners, Properties, Activity, Settings)
│   │   │   ├── auth/          # Authentication flows (Signin, Signup, Reset Password)
│   │   │   ├── user/          # PG Owner dashboard and operational modules
│   │   │   └── page.tsx       # ChooseBed landing page
│   │   └── api/               # Next.js API route handlers (Auth, Admin actions, Webhooks)
│   ├── components/
│   │   ├── Admin/             # Admin suite components (OwnersManagement, ActivityLogViewer, etc.)
│   │   ├── Common/            # Reusable UI primitives (Card, Badge, Button, BrandLogo, Sidebar)
│   │   └── Home/              # Landing page marketing components (Hero, Features, Roadmap, FAQ)
│   ├── libs/                  # Database client, auth utilities, and formatters
│   ├── middleware.ts          # Edge authentication & role-based routing middleware
│   └── staticData/            # Sidebar navigation data and configuration
└── README.md
```

---

## 🏁 Getting Started

### Prerequisites

- **Node.js**: v18.18.0 or newer (v20+ recommended)
- **Package Manager**: npm, yarn, or pnpm
- **Database**: PostgreSQL (local instance or hosted on Supabase / Neon)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/chooseroom/chooseroom-web.git
cd chooseroom-web
npm install
```

### 2. Environment Variables Configuration

Create a `.env` file in the root directory:

```env
# Database Connections (Supabase / PostgreSQL)
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-high-entropy-secret-key"

# Email / SMTP (Optional for notification delivery)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="user"
EMAIL_SERVER_PASSWORD="password"
EMAIL_FROM="no-reply@chooseghar.com"
```

### 3. Initialize Prisma Database Client

```bash
# Generate Prisma Client
npx prisma generate

# Synchronize Schema with Database
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be live at [http://localhost:3000](http://localhost:3000).

---

## 📜 Available Scripts

| Command                | Purpose                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `npm run dev`          | Start Next.js local development server with Turbopack / Fast Refresh |
| `npm run build`        | Generate Prisma client and create production bundle                  |
| `npm run start`        | Start production server                                              |
| `npm run check-lint`   | Validate codebase against ESLint rules                               |
| `npm run fix-lint`     | Automatically fix auto-fixable ESLint issues                         |
| `npm run check-format` | Check code formatting with Prettier                                  |
| `npm run fix-format`   | Format entire project with Prettier                                  |
| `npm run test-build`   | Full verification pipeline (format check, lint check, build test)    |

---

## 🗺️ Product Roadmap

- [x] **Phase A**: Security hardening, password salting, role-based session isolation.
- [x] **Phase B**: ChooseBed modern brand identity, color tokens, and vector assets.
- [x] **Phase C**: High-converting PG Owner SaaS landing page with interactive previews.
- [x] **Phase D**: Complete Admin Control Center (Owners management, Properties audit, Security logs, Settings).
- [ ] **Phase E**: Interactive PG Room Layout Designer and Bed Allocation Visualizer.
- [ ] **Phase F**: Automated UPI / WhatsApp rent reminders and digital receipt generator.

---

## 📄 License

Private and proprietary. All rights reserved by **ChooseBed.com**.
