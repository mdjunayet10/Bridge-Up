# Skill Bridge

This repository contains a developed MVP implementation of the Career Bridge proposal:

- Job discovery UI
- Salary insight cards (BDT)
- Job detail view with requirements
- Job application flow
- Employer job posting and listing management
- Responsive design for desktop/tablet/mobile
- Express API with in-memory data store

## Project Structure

```
.
├── index.html
├── scripts/
│   └── main.js
├── styles/
│   └── main.css
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── data/
│       │   └── store.js
│       ├── server.js
│       └── routes/
│           ├── applications.js
│           ├── jobs.js
│           └── salaries.js
└── README.md
```

## Run The Project

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Start server:
   ```bash
   cp .env.example .env
   npm run dev
   ```
3. Open in browser:
   - `http://localhost:4000`

Note:
- If you open `index.html` directly, the frontend runs in offline demo mode.
- Full live mode (post/apply/delete via API) requires backend running.
- Demo employer login for dashboard/CV access:
   - Email: `employer@careerbridge.com`
   - Access key: `demo1234`
- Demo employee login for applications:
   - Email: `employee@careerbridge.com`
   - Password: `demo1234`
- Optional backend hardening settings in `.env`:
   - `CLIENT_ORIGIN=*`
   - `RATE_LIMIT_WINDOW_MS=60000`
   - `RATE_LIMIT_MAX=120`
   - `TRUST_PROXY=false`
   - `AUTH_SESSION_TTL_MS=28800000` (8 hours)
   - `REQUIRE_EMPLOYEE_AUTH=true`

## Implemented Frontend Features

- Live API connection status indicator
- Search and filter jobs in real time
- View job details in modal
- Submit applications from modal form
- Upload CV during application (PDF, DOC, DOCX)
- Post jobs from employer form
- Remove listings from employer panel
- View recent submitted applications
- Employer-only CV viewing for owned job applications
- CV preview modal and direct CV download for employers
- Employer sign-out action in dashboard
- Header-based employer credential flow for sensitive operations
- Token-based employer login session (`/api/auth/login`)
- Token-based employee login session for application submission

## API Endpoints

- `POST /api/auth/login` (body with `role`):
   - Employer: `role=employer`, `employerEmail`, `employerKey`
   - Employee: `role=employee`, `employeeEmail`, `employeePassword`
- `GET /api/auth/me` (requires `Authorization: Bearer <token>`)
- `POST /api/auth/logout` (requires `Authorization: Bearer <token>`)
- `GET /api/health`
- `GET /api/salaries`
- `GET /api/jobs`
- `GET /api/jobs?q=keyword&location=city&type=type`
- `GET /api/jobs` with `Authorization: Bearer <token>` or headers `x-employer-email`, `x-employer-key` (owner-scoped dashboard)
- `GET /api/jobs/:id`
- `POST /api/jobs` (requires `Authorization: Bearer <token>` or headers `x-employer-email`, `x-employer-key`)
- `DELETE /api/jobs/:id` (requires `Authorization: Bearer <token>` or headers `x-employer-email`, `x-employer-key`)
- `GET /api/applications` (requires `Authorization: Bearer <token>` or headers `x-employer-email`, `x-employer-key`)
- `GET /api/applications?jobId=number` (requires `Authorization: Bearer <token>` or headers `x-employer-email`, `x-employer-key`)
- `POST /api/applications` (multipart/form-data with `cvFile`, requires employee `Authorization: Bearer <token>` when `REQUIRE_EMPLOYEE_AUTH=true`)
- `GET /api/applications/:id/cv` (requires `Authorization: Bearer <token>` or headers `x-employer-email`, `x-employer-key`)

Compatibility note:
- Query/body credentials are still accepted for backward compatibility, but bearer tokens are now preferred.

## Next Suggested Steps

1. Persist data with a real database (PostgreSQL / MongoDB).
2. Add authentication and role-based access.
3. Add input validation middleware and rate limiting.
4. Add automated API and UI tests.
5. Deploy backend + frontend to Firebase/Cloud target.
