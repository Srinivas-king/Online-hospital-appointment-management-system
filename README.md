# Sentini Hospital Appointment System

A real-time, professional hospital appointment booking system built with modern web technologies.

## Technology Stack
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+), Socket.io Client
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MySQL with Drizzle ORM
- **Real-Time**: Socket.io
- **Security**: JWT Authentication, Bcrypt password hashing

## Quick Start

### 1. Prerequisites
- Node.js (v18+)
- MySQL Workbench/Server

### 2. Environment Setup
Rename `.env.example` (or use existing `.env`) and update details:
```env
PORT=3000
DATABASE_URL=mysql://root:yourpassword@localhost:3306/hospital_db
JWT_SECRET=your_jwt_secret
```

### 3. Installation
```bash
# Clone the repository
git clone https://github.com/Srinivas-king/Online-hospital-appointment-management-system.git
cd Online-hospital-appointment-management-system

# Install dependencies
npm install
```

### 4. Database Initialization
```bash
# Push schema to MySQL
npm run db:push
```

### 5. Start the Application
```bash
# Start development server
npm run dev
```

### 6. Authentication
- **Register** as a patient at `frontend/assets/patient-register.html`.
- **Note**: To create an Admin, you can manually change the `role` in the `users` table to `admin` or use the registration endpoint with `role: 'admin'`.

## Features
- ✅ Real-time status notifications for patients.
- ✅ Admin dashboard for request approval/rejection.
- ✅ Slot management for doctors' availability.
- ✅ Responsive, professional UI design.
