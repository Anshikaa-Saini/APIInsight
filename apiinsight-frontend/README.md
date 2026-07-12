# APIInsight Frontend

React + Vite client for the APIInsight application.

## Stack

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS

## Setup

```bash
npm install
```

Create a local environment file if you need to override the API base URL:

```bash
cp .env.example .env
```

Example:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Run locally

```bash
npm run dev
```

The app will be available at:

```text
http://localhost:5173
```

## Build for production

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Main features

- User authentication (login/register)
- Project dashboard and project creation from OpenAPI/Swagger specs
- Endpoint browsing and detail views
- Test case and execution history views
- Report generation page

## Folder structure

```text
src/
├── api/           # API client modules
├── components/    # Reusable UI components
├── context/       # React context providers
├── hooks/         # Custom hooks
├── pages/         # Route-level pages
├── routes/        # Application routing
└── main.jsx       # App entry point
```

## Notes

- The frontend expects the backend to be running on port 5000 by default.
- If your backend runs elsewhere, set VITE_API_BASE_URL accordingly.
