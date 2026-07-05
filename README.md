# APIInsight — Milestone 1: Auth + Project Setup

This milestone delivers a working, testable slice of the app:

- User registration & login (JWT-based)
- Protected `/api/auth/me` route
- React frontend with Login, Register, and a protected Dashboard page
- Consistent error handling and request validation on the backend
- Dockerfiles for both services + a root `docker-compose.yml`

Nothing else (spec upload, AI test generation, execution, reports) is wired up yet —
that comes in later milestones, matching the design doc.

## Running locally (without Docker)

**Backend**
```bash
cd apiinsight-backend
cp .env.example .env      # make sure MONGO_URI points to a running MongoDB
npm install
npm run dev
```

**Frontend**
```bash
cd apiinsight-frontend
cp .env.example .env
npm install
npm run dev
```

Visit `http://localhost:5173`, register a new account, and you'll land on the
protected Dashboard page. Refreshing the page keeps you logged in (the token
is validated against `/api/auth/me` on load).

## Running with Docker

```bash
docker-compose up --build
```

This starts MongoDB, the backend (port 5000), and the frontend (port 5173).

## What to verify manually

1. Register a new user → redirected to `/dashboard`, name shown in navbar.
2. Refresh the page → still logged in (no redirect to `/login`).
3. Click Logout → redirected to `/login`, and `/dashboard` becomes inaccessible
   directly (redirects back to `/login`).
4. Try registering the same email twice → clear error message, no crash.
5. Try logging in with a wrong password → clear error message.

## Backend tests

```bash
cd apiinsight-backend
npm test
```

Uses `mongodb-memory-server`, so it needs internet access on first run to
download the MongoDB binary (cached afterwards). No real database required.

## Folder structure

```
apiinsight-backend/    # Node.js + Express + MongoDB + JWT
apiinsight-frontend/   # React + Vite + Tailwind
docker-compose.yml     # spins up mongo + backend + frontend together
```

See each service's own README for more detail.
