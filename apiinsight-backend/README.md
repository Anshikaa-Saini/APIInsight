# APIInsight Backend

Milestone 1: Auth + Project Setup

## Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Zod for request validation

## Setup

```bash
cp .env.example .env
# edit .env with your MongoDB URI and JWT secret

npm install
npm run dev       # starts with nodemon on http://localhost:5000
```

## Run tests

```bash
npm test
```

Tests use `mongodb-memory-server`, so no real database is required to run them.

## Endpoints (Milestone 1)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current logged-in user |

### Register
```
POST /api/auth/register
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

### Login
```
POST /api/auth/login
{
  "email": "jane@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "name": "Jane Doe", "email": "jane@example.com" },
    "token": "eyJ..."
  },
  "message": "Login successful"
}
```

Use the returned token as `Authorization: Bearer <token>` for protected routes.

## Folder structure

```
src/
├── config/       # env loading, DB connection
├── models/       # Mongoose schemas
├── routes/       # Express routers
├── controllers/  # HTTP request/response handling
├── services/     # business logic
├── middleware/   # authGuard, errorHandler, requestLogger, validateRequest
├── utils/        # ApiError, ApiResponse, asyncHandler
├── validators/   # Zod schemas
├── app.js        # Express app assembly
└── server.js     # entry point
```

## Docker

```bash
docker build -t apiinsight-backend .
docker run -p 5000:5000 --env-file .env apiinsight-backend
```
