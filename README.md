# RajWorthman — Driver Partner Portal

*Drive | Manage | Grow* · Version 0.0.1 (Sprint 1) — see [CHANGELOG.md](CHANGELOG.md)

A full-stack web application for managing RajWorthman driver partner registrations, document verification, and admin approvals.

---

## Features

- 3-step driver registration wizard (personal details → driving info → documents)
- Profile photo upload directly to Cloudinary
- Document uploads (Aadhaar, Licence, PAN, Address Proof) stored on Cloudinary
- JWT authentication with refresh token rotation
- Driver dashboard with profile completion tracker
- Admin panel to approve / reject / flag driver applications
- In-app notifications for status updates
- 404 page, rate limiting, helmet security headers

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Zustand, React Hook Form, Zod, React Router DOM, Lucide Icons |
| Backend | Node.js, Express 5, TypeScript, Prisma ORM, PostgreSQL, JWT, bcryptjs, Helmet, express-rate-limit |
| Storage | Cloudinary (images & documents) |

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm 9+
- A free [Cloudinary](https://cloudinary.com) account

---

## Project Structure

```
trvel_app/
├── backend/          # Express API
│   ├── prisma/       # Schema and migrations
│   └── src/
│       ├── controllers/
│       ├── middlewares/
│       ├── routes/
│       └── utils/
└── frontend/         # React + Vite app
    └── src/
        ├── features/registration/   # 3-step wizard
        ├── layouts/
        ├── pages/
        ├── services/
        └── store/
```

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/PosibabuYalla/traveline.git
cd traveline
```

### 2. Create the database

```sql
CREATE DATABASE travelline_db;
```

### 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in every value:

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/travelline_db"

JWT_SECRET="a-long-random-string-at-least-32-chars"
JWT_REFRESH_SECRET="another-long-random-string-different-from-above"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

ADMIN_SETUP_SECRET="choose-a-secret-for-the-one-time-admin-seed"
```

> **Important:** The server will refuse to start if `JWT_SECRET` or `JWT_REFRESH_SECRET` are missing or weak.

### 4. Run migrations and start the backend

```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

API runs on **http://localhost:3001**

### 5. Configure the frontend

```bash
cd ../frontend
cp .env.example .env   # or create .env manually
```

`frontend/.env`:

```env
VITE_API_URL=/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

Cloudinary is optional for local development: if `VITE_CLOUDINARY_CLOUD_NAME` / `VITE_CLOUDINARY_UPLOAD_PRESET`
are not set, uploads are stored by the backend in `backend/uploads/` (via `POST /api/uploads`).

To get these values:
1. Log in to [cloudinary.com](https://cloudinary.com) → Settings → Upload
2. Create an **unsigned** upload preset (call it e.g. `driver-registration`)
3. Copy your cloud name from the dashboard

### 6. Start the frontend

```bash
npm install
npm run dev
```

App runs on **http://localhost:5173**

To open it from a phone on the same Wi-Fi, run `npx vite --host` and browse to `http://<your-PC-IP>:5173`.
Add that origin to `CORS_ORIGIN` in `backend/.env` (comma-separated list).

---

## Public website & app download

`/` is the public home page (services, driver sign-up, app download). Its **Download for Android** button
fetches `/downloads/RajWorthman-latest.apk`, served by the backend from `backend/downloads/` (not committed).
The version, file size and optional contact details are in `frontend/src/config/site.ts`
(or `VITE_CONTACT_PHONE`, `VITE_CONTACT_EMAIL`, `VITE_CONTACT_ADDRESS`, `VITE_APK_URL`).

## Deploying to a VPS

See **[deploy/DEPLOY_VPS.md](deploy/DEPLOY_VPS.md)** for PostgreSQL setup (with the full schema in
`deploy/schema.sql`), PM2, Nginx (`deploy/nginx-rajworthman.conf`), HTTPS and backups.

## Mobile apps (Android & iOS)

The same React app is packaged as native apps with [Capacitor](https://capacitorjs.com)
(`frontend/android`, `frontend/ios`, config in `frontend/capacitor.config.json`).

Inside the app the API must be an absolute URL the phone can reach — set it in `frontend/.env.android`:

```env
VITE_API_URL=http://<your-PC-LAN-IP>:3001/api   # or your deployed API, e.g. https://api.example.com/api
```

and make sure `backend/.env` `CORS_ORIGIN` includes `http://localhost,capacitor://localhost` (the app origins on Android / iOS).

### Android APK

Requires JDK 21 and the Android SDK (platform 35, build-tools 35) — set `JAVA_HOME` and `ANDROID_HOME`, or
`sdk.dir` in `frontend/android/local.properties`.

```bash
cd frontend
npm run apk
# -> android/app/build/outputs/apk/debug/app-debug.apk
```

Install it on a phone (enable "Install unknown apps"), or `adb install -r app-debug.apk`.
The phone must be on the same network as the backend, and Windows Firewall must allow Node.js on port 3001.

### iOS

iOS builds need a Mac with Xcode:

```bash
cd frontend
npm run build:ios
npx cap open ios   # build & run from Xcode (a signing team is required for a real device)
```

---

## Creating the first admin account

This is a one-time step. The `/api/admin/seed` endpoint creates an admin user using the secret you set in `ADMIN_SETUP_SECRET`. Run it once with curl or Postman:

```bash
curl -X POST http://localhost:3001/api/admin/seed \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rajworthman.com","password":"<your-password>","secret":"<your-ADMIN_SETUP_SECRET>"}'
```

After this, log in at **http://localhost:5173/admin/login** with those credentials.

---

## Environment Variables

### backend/.env

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Strong random string for access tokens |
| `JWT_REFRESH_SECRET` | Yes | Strong random string for refresh tokens |
| `JWT_EXPIRES_IN` | No | Access token TTL (default `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh token TTL (default `7d`) |
| `PORT` | No | API port (default `3001`) |
| `CORS_ORIGIN` | No | Frontend origin (default `http://localhost:5173`) |
| `ADMIN_SETUP_SECRET` | Yes | Secret for the one-time admin seed endpoint |
| `SMTP_HOST` | No | SMTP server for email notifications |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |

### frontend/.env

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend URL prefix (use `/api` with a proxy, or full URL) |
| `VITE_CLOUDINARY_CLOUD_NAME` | Yes | Your Cloudinary cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Yes | Unsigned upload preset name |

---

## Application Routes

| Route | Description |
|---|---|
| `/login` | Driver login |
| `/register` | 3-step registration wizard |
| `/registration-success` | Post-registration confirmation |
| `/dashboard` | Driver dashboard |
| `/profile` | Driver profile |
| `/documents` | Document management |
| `/vehicles` | Vehicle management |
| `/notifications` | Notifications |
| `/settings` | Account settings |
| `/admin/login` | Admin login |
| `/admin/drivers` | Admin — driver list with search & filter |
| `/admin/drivers/:id` | Admin — driver detail + approve/reject |

---

## API Reference

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Driver Registration
```
PUT  /api/drivers/registration/step/1   # Personal details + address
PUT  /api/drivers/registration/step/2   # Driving info
PUT  /api/drivers/registration/step/3   # Vehicle details
POST /api/drivers/registration/submit   # Final submit
GET  /api/drivers/me
PUT  /api/drivers/me
```

### Documents
```
POST   /api/documents/save-url   # Save a Cloudinary URL to the DB
GET    /api/documents/me
DELETE /api/documents/:id
```

### Vehicles
```
POST   /api/vehicles
GET    /api/vehicles
PUT    /api/vehicles/:id
DELETE /api/vehicles/:id
```

### Dashboard & Notifications
```
GET /api/dashboard/overview
GET /api/notifications
PUT /api/notifications/:id/read
PUT /api/notifications/read-all
```

### Admin (requires admin JWT)
```
POST /api/admin/seed               # One-time admin account creation
POST /api/admin/login
GET  /api/admin/stats
GET  /api/admin/drivers            # ?search=&status=&page=
GET  /api/admin/drivers/:id
PUT  /api/admin/drivers/:id/status # { status, rejectionReason }
```

---

## Registration Flow

1. Driver visits `/register`
2. **Step 1** — Full name, DOB, gender, mobile, address, registration type, profile photo (uploaded to Cloudinary immediately)
3. **Step 2** — Driving licence details, experience, languages, categories, emergency contact
4. **Step 3** — Document uploads (Aadhaar, Licence front/back, PAN, Address Proof), vehicle details if applicable
5. **Success screen** — shows registration ID; driver proceeds to dashboard
6. Admin reviews in `/admin/drivers` and approves or rejects

---

## Production Build

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Serve the dist/ folder from your web server or deploy to Vercel / Netlify
```

Set `NODE_ENV=production` and `CORS_ORIGIN` to your production frontend URL in the backend `.env`.

---

## Security

- `.env` files are in `.gitignore` — never commit them
- JWT secrets must be strong; the server will crash on startup if they are missing or weak
- `ADMIN_SETUP_SECRET` controls who can create admin accounts — keep it private
- All routes use `helmet` headers and `express-rate-limit` (100 req/15 min general, 10 req/15 min auth, 20 req/15 min admin)
- Admin dashboard routes require a valid admin JWT; unauthenticated requests are redirected to `/admin/login`
