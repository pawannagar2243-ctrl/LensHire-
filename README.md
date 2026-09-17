# Camera Booking Website

Full-stack camera rental and booking platform with a customer website, admin dashboard, and REST API.

## Stack

- **Frontend:** React.js, Bootstrap 5, React Router, Axios, Bootstrap Icons
- **Admin:** React.js, Bootstrap 5, React Router, Axios, Recharts (embedded in the frontend)
- **Backend:** Node.js, Express.js, MongoDB, JWT, bcrypt, Multer

## Project Structure

```text
camera-booking/
├── frontend/     # Customer website + admin panel (port 5173)
├── backend/      # API server (port 5000)
├── package.json
└── README.md
```

## Prerequisites

- Node.js 18+
- MongoDB running locally (or update `MONGODB_URI` in `backend/.env`)

## Setup

```bash
# Install all dependencies
npm run install:all

# Configure environment (already has defaults)
# Edit backend/.env if needed

# Seed demo data (admin + sample cameras)
npm run seed

# Start backend + frontend together
npm run dev
```

## Individual Commands

```bash
npm run backend    # API on http://localhost:5000
npm run frontend   # Customer site + admin panel on http://localhost:5173
npm run seed       # Seed MongoDB with demo data
```

## Demo Accounts

| Role  | Email                     | Password  |
|-------|---------------------------|-----------|
| Admin | admin@camerabooking.com   | admin123  |
| User  | user@example.com          | user123   |

## API Overview

- `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/cameras`
- `GET/POST/PUT/DELETE /api/categories`
- `POST/GET/PUT/DELETE /api/bookings`
- `GET/PUT/DELETE /api/users` (admin)
- `GET /api/reviews/:cameraId` · `POST /api/reviews`
- `POST /api/payments` · `PUT /api/payments/:id/confirm`
- `GET /api/dashboard/stats` (admin)

## Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/camera-booking
JWT_SECRET=your_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

Frontend uses:

```env
VITE_API_URL=http://localhost:5000/api
```

## Features

- JWT auth with user/admin roles
- Camera listing, filters, details, reviews
- Booking with overlap prevention
- Admin panel at http://localhost:5173/admin
- Admin dashboard with charts
- Camera, category, user, and booking management
- Modular payment model (Razorpay-ready)
