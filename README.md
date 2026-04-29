# Career Bridge

Career Bridge is a Bangladesh-focused job and career platform that supports job discovery, salary insight, CV applications, employer job posting, and employer-scoped applicant review.

- GitHub-inspired full dark professional UI using near-black surfaces, subtle borders, muted text, and restrained green/blue actions
- Salary insight cards in BDT
- Job detail modal with requirements
- Employee/job seeker login and CV application flow
- Employer login, job posting, listing management, and applicant review
- Employer-only CV preview/download for owned job applications
- Responsive design for mobile, tablet, and desktop
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

Do not commit real `.env` files, `node_modules`, `.venv`, `.DS_Store`, or private files in `backend/uploads/`. The `.gitignore` is configured to keep uploaded CVs out of source control except `backend/uploads/.gitkeep`.

## Implemented Frontend Features

- Live API connection status indicator
- Search and filter jobs in real time
- Quick filter chips for common job searches
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
- GitHub-style dark responsive UI with dark panels, modal transitions, focus states, subtle hover states, and reduced-motion support


## Theme Update

The UI has been restyled to a GitHub Dark-inspired product theme:

- Near-black app background: `#010409` / `#0d1117`
- Dark cards and dashboard panels: `#161b22`
- Thin GitHub-style borders: `#30363d`
- Muted secondary text: `#8b949e`
- Green primary actions: `#238636`
- Blue links/focus accents: `#58a6ff`
- No bright glassmorphism/neon backgrounds
- Subtle hover, modal, and reveal transitions

This keeps the app professional and serious, closer to GitHub's dashboard style while still fitting a career platform.

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

