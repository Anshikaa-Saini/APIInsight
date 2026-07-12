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

## Endpoints (Milestone 3: AI Test Case Generation)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/endpoints/:endpointId/generate-testcases` | Yes | Generate AI test cases for one endpoint (replaces old ones) |
| POST | `/api/projects/:projectId/generate-testcases` | Yes | Generate AI test cases for every endpoint in a project |
| GET | `/api/endpoints/:endpointId/testcases` | Yes | List test cases for an endpoint |

Both generation routes are rate-limited (20 requests / 15 min / IP) since they cost real
AI provider tokens. Requires `OPENAI_API_KEY` in `.env` (see `.env.example` — this also
works with Groq's free tier by setting `AI_BASE_URL`).

## Endpoints (Milestone 4: Execution Engine)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| PATCH | `/api/projects/:projectId/base-url` | Yes | Manually set/override the target API base URL |
| POST | `/api/testcases/:testCaseId/execute` | Yes | Run a single test case against the target API |
| POST | `/api/endpoints/:endpointId/execute` | Yes | Run every test case for one endpoint |
| POST | `/api/projects/:projectId/execute` | Yes | Run every test case across the whole project |
| GET | `/api/endpoints/:endpointId/executions` | Yes | List execution history for an endpoint |
| GET | `/api/projects/:projectId/executions` | Yes | List execution history for a project |

### How execution works

1. When a spec is uploaded, `specParser.service.js` also tries to extract a **base
   URL** — from OpenAPI 3's `servers[0].url`, or Swagger 2's `host`/`basePath`/`schemes`.
   If the spec doesn't declare one, `Project.baseUrl` stays `null` and can be set
   manually via `PATCH /:projectId/base-url`.
2. `executor.service.js` builds a real HTTP request from the endpoint's method/path
   and the test case's `requestPayload` (path params get substituted into the path
   template, the rest becomes query/headers/body), and sends it with Axios.
3. **Any** HTTP response (including 4xx/5xx) is a valid result and gets recorded —
   `axios`'s `validateStatus` is overridden so it never throws on a non-2xx status.
   Only a request that never got a response at all (DNS failure, timeout, connection
   refused) is treated as an execution failure, with `actualStatusCode: null`.
   Response bodies over 5KB are truncated before being stored.
4. `passed` is a simple, deterministic comparison: `actualStatusCode === expectedStatusCode`.
   No AI involved in judging pass/fail — that keeps it explainable and reproducible.
5. Running a project or endpoint processes its test cases **sequentially, not in
   parallel** — deliberately, so this tool doesn't itself hammer someone's API with a
   burst of concurrent requests.

Try it with the fixture that has a `servers` block:
```bash
curl -X POST http://localhost:5000/api/projects/upload-file \
  -H "Authorization: Bearer <your-token>" \
  -F "specFile=@tests/fixtures/sample-petstore-with-server.yaml"
# -> project.baseUrl will be "https://petstore.example.com/v1" (a fake demo domain -
#    swap it via PATCH .../base-url to point at a real API you want to test)
```


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

## Endpoints (Milestone 5: Risk Scoring & AI Reports)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/projects/:projectId/generate-report` | Yes | Compute risk score + AI summary/suggestions from the latest test results |
| GET | `/api/projects/:projectId/report` | Yes | Get the most recently generated report |
| GET | `/api/projects/:projectId/reports/history` | Yes | List every report ever generated for a project |

Rate-limited the same as test case generation, since it also calls the AI provider.

### How reporting works

1. `report.service.js` pulls every `Execution` for the project, and keeps only the
   **most recent** execution per test case — so re-running tests after a fix doesn't
   double-count an old failure alongside the new passing result.
2. `riskScore.service.js` computes a **deterministic** 0–100 score from those results —
   no AI involved. Failures are weighted by test case category (`security` failures cost
   more than `positive` ones), which keeps the number explainable and reproducible: the
   same inputs always give the same score, and anyone can verify the math by hand.
3. `aiSummary.service.js` takes those stats (counts, risk score, which endpoints failed)
   and asks the AI provider for a short plain-English summary and 3–6 concrete developer
   suggestions — AI is only used for the narrative, never for the score itself.
4. Everything is saved as a `Report` document, so past reports stay available via the
   history endpoint (e.g. to see if risk went up or down after a fix).

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
