# Online Library Management System

A full-stack library management project with:

- `Admin`, `Librarian`, and `Student` roles
- React + Tailwind frontend
- Node.js + Express backend
- MongoDB with Mongoose
- JWT authentication and role-based authorization
- Socket.io real-time notifications and stock updates
- Chart.js analytics
- QR membership card generation and QR-based return scanning
- PDF report exports

## Project Structure

```text
online-library-management-system/
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   └── src/
│       ├── api/
│       ├── components/
│       │   ├── books/
│       │   ├── charts/
│       │   ├── common/
│       │   └── qr/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       │   ├── admin/
│       │   ├── auth/
│       │   ├── librarian/
│       │   ├── public/
│       │   └── student/
│       ├── utils/
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
├── server/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       ├── controllers/
│       ├── jobs/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── seeds/
│       ├── services/
│       └── utils/
├── package.json
└── README.md
```

## Main Features

### Admin

- Manage users and assign roles
- View analytics dashboard
- Monitor suspicious actions and audit logs
- Export PDF reports
- Manage operational settings

### Librarian

- Add, update, and delete books
- Manage authors and categories
- Issue and return books
- Use QR return scanning
- Monitor waiting queue and fines

### Student

- Register and log in
- Search books by title, author, and category
- Borrow or reserve books
- View live availability updates
- Manage reservations
- View QR membership card
- Track due dates and fines

## Backend Collections

- `users`
- `books`
- `categories`
- `authors`
- `borrows`
- `reservations`
- `fines`
- `activity_logs`
- `notifications`
- `systemsettings`

## Environment Setup

### Root

Install workspace dependencies:

```bash
npm install
```

### Server

Copy [server/.env.example](/C:/Users/kavithushan/Desktop/ITPM&library/server/.env.example) to `server/.env` and configure:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/library_management
JWT_SECRET=replace_this_with_a_long_secret
JWT_EXPIRES_IN=7d
DAILY_FINE_RATE=25
BORROW_PERIOD_DAYS=14
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=no-reply@library.local
```

### Client

Copy [client/.env.example](/C:/Users/kavithushan/Desktop/ITPM&library/client/.env.example) to `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Run the Project

### 1. Seed sample data

```bash
npm run seed
```

### 2. Start frontend and backend

```bash
npm run dev
```

## Seed Credentials

- Admin: `kobi03@gmail.com` / `Admin@123`
- Librarian: `kavisaran@gmail.com` / `Librarian@123`
- Student: `kiri03@gmail.com` / `Student@123`
- Restricted Student: `student2@library.com` / `Student@123`

## Key API Areas

- `/api/auth`
- `/api/users`
- `/api/books`
- `/api/categories`
- `/api/authors`
- `/api/borrows`
- `/api/reservations`
- `/api/fines`
- `/api/notifications`
- `/api/dashboard`
- `/api/reports`
- `/api/activity-logs`
- `/api/settings`

## Notes

- The server includes a reminder job scaffold for due-date notifications.
- OTP email delivery is wired through Nodemailer and falls back to console/dev preview when SMTP is not configured.
- Real-time updates are sent through Socket.io for notifications, stock changes, queue readiness, and admin activity events.
- The frontend is organized by role and uses protected routes for authorization.
