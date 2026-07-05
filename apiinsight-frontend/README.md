# APIInsight Frontend

Milestone 1: Auth pages + protected Dashboard shell.

## Stack
- React 19 + Vite
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no separate config file needed)
- React Router v6
- Axios

## Setup

```bash
cp .env.example .env
npm install
npm run dev       # http://localhost:5173
```

Make sure the backend is running (see `../apiinsight-backend`) so the API calls
have something to talk to.

## Structure

```
src/
├── api/            # axios instance + per-resource API call functions
├── components/
│   ├── common/     # Button, Input
│   └── layout/     # Navbar, ProtectedRoute
├── context/        # AuthContext (holds user + token state)
├── hooks/          # useAuth
├── pages/          # LoginPage, RegisterPage, DashboardPage, NotFoundPage
├── routes/         # AppRoutes
├── App.jsx
└── main.jsx
```

## How auth works here

- On login/register, the backend returns a JWT which is stored in
  `localStorage` and attached to every subsequent request via an axios
  request interceptor (`src/api/axiosInstance.js`).
- On app load, `AuthContext` checks for an existing token and calls
  `GET /api/auth/me` to restore the session (or clears the token if it's
  invalid/expired).
- `ProtectedRoute` blocks access to authenticated-only pages until that
  check finishes, then redirects to `/login` if there's no valid user.
- A 401 response from any API call automatically logs the user out and
  redirects to `/login` (handled in the axios response interceptor).
