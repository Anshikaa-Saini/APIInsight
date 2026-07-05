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

## Endpoints (Milestone 1: Auth)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current logged-in user |

## Endpoints (Milestone 2: Spec Ingestion)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/projects/upload-file` | Yes | Upload a Swagger/OpenAPI file (`specFile` field, .json/.yaml/.yml) |
| POST | `/api/projects/upload-url` | Yes | Submit a Swagger/OpenAPI spec URL (`{ "url": "..." }`) |
| GET | `/api/projects` | Yes | List all projects for the logged-in user |
| GET | `/api/projects/:projectId` | Yes | Get a single project |
| DELETE | `/api/projects/:projectId` | Yes | Delete a project and its endpoints |
| GET | `/api/projects/:projectId/endpoints` | Yes | List parsed endpoints for a project |
| GET | `/api/endpoints/:endpointId` | Yes | Get a single endpoint's detail |

### How spec parsing works

1. `POST /api/projects/upload-file` or `/upload-url` creates a `Project` document with `status: "processing"`.
2. The raw spec is handed to `specParser.service.js`, which uses **Swagger Parser**
   (`SwaggerParser.validate()`) to both validate the spec against the OpenAPI/Swagger
   schema *and* dereference all `$ref` pointers in one call.
3. The dereferenced spec's `paths` object is flattened into one `Endpoint` document
   per (path, method) pair — each with its parameters, request body schema, and
   response definitions already resolved (no `$ref` chasing needed later).
4. On success, the `Project` is marked `"parsed"` with an `endpointCount`. On failure
   (invalid spec, unreachable URL, bad JSON/YAML), it's marked `"failed"` with a
   human-readable `failureReason` — the project row still shows up in the UI so the
   failure is visible, instead of just returning an error and losing the attempt.

Try it with the sample spec in `tests/fixtures/sample-petstore.yaml`:
```bash
curl -X POST http://localhost:5000/api/projects/upload-file \
  -H "Authorization: Bearer <your-token>" \
  -F "specFile=@tests/fixtures/sample-petstore.yaml"
```

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
