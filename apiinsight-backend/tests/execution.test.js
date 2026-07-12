const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

// The executor calls axios.request under the hood by default. We mock the
// whole module so these tests never make a real network call - only our
// own routing/persistence logic is under test here, not the network.
jest.mock('axios');
const axios = require('axios');

let app;
let mongoServer;
let token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test_secret';

  await mongoose.connect(process.env.MONGO_URI);
  app = require('../src/app');

  const registerRes = await request(app).post('/api/auth/register').send({
    name: 'Test User',
    email: 'exec-test@example.com',
    password: 'password123',
  });
  token = registerRes.body.data.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Execution API', () => {
  let projectWithServerId;
  let projectWithoutServerId;
  let endpointId;
  let testCaseId;

  it('uploads a spec WITH a servers[] block and auto-populates baseUrl', async () => {
    const res = await request(app)
      .post('/api/projects/upload-file')
      .set('Authorization', `Bearer ${token}`)
      .attach('specFile', path.join(__dirname, 'fixtures/sample-petstore-with-server.yaml'));

    expect(res.statusCode).toBe(201);
    expect(res.body.data.project.baseUrl).toBe('https://petstore.example.com/v1');
    projectWithServerId = res.body.data.project._id;

    const endpointsRes = await request(app)
      .get(`/api/projects/${projectWithServerId}/endpoints`)
      .set('Authorization', `Bearer ${token}`);
    endpointId = endpointsRes.body.data.endpoints.find((e) => e.method === 'GET' && e.path === '/pets')._id;
  });

  it('uploads a spec WITHOUT a servers[] block and leaves baseUrl null', async () => {
    const res = await request(app)
      .post('/api/projects/upload-file')
      .set('Authorization', `Bearer ${token}`)
      .attach('specFile', path.join(__dirname, 'fixtures/sample-petstore.yaml'));

    expect(res.statusCode).toBe(201);
    expect(res.body.data.project.baseUrl).toBeNull();
    projectWithoutServerId = res.body.data.project._id;
  });

  it('refuses to execute when the project has no baseUrl set', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectWithoutServerId}/execute`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/base URL/i);
  });

  it('lets the user manually set a baseUrl via PATCH', async () => {
    const res = await request(app)
      .patch(`/api/projects/${projectWithoutServerId}/base-url`)
      .set('Authorization', `Bearer ${token}`)
      .send({ baseUrl: 'https://manually-set.example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.project.baseUrl).toBe('https://manually-set.example.com');
  });

  it('rejects an invalid URL when setting baseUrl', async () => {
    const res = await request(app)
      .patch(`/api/projects/${projectWithoutServerId}/base-url`)
      .set('Authorization', `Bearer ${token}`)
      .send({ baseUrl: 'not-a-url' });

    expect(res.statusCode).toBe(400);
  });

  it('creates a test case directly (bypassing AI) to execute against', async () => {
    // We insert this directly via the model rather than calling the real
    // AI generation endpoint, so this test suite doesn't depend on an
    // OpenAI/Groq key being configured.
    const TestCase = require('../src/models/TestCase');
    const doc = await TestCase.create({
      endpoint: endpointId,
      project: projectWithServerId,
      title: 'Should list pets successfully',
      category: 'positive',
      requestPayload: { headers: {}, query: {}, pathParams: {}, body: null },
      expectedStatusCode: 200,
      expectedBehaviour: 'Returns a 200 with a list of pets',
      generatedBy: 'manual',
    });
    testCaseId = doc._id.toString();
    expect(testCaseId).toBeDefined();
  });

  it('executes a single test case and records a passing result', async () => {
    axios.request.mockResolvedValueOnce({ status: 200, data: [{ id: '1', name: 'Fido' }] });

    const res = await request(app)
      .post(`/api/testcases/${testCaseId}/execute`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.execution.passed).toBe(true);
    expect(res.body.data.execution.actualStatusCode).toBe(200);
    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://petstore.example.com/v1/pets', method: 'GET' })
    );
  });

  it('records a failing result when the actual status does not match expected', async () => {
    axios.request.mockResolvedValueOnce({ status: 500, data: { error: 'boom' } });

    const res = await request(app)
      .post(`/api/testcases/${testCaseId}/execute`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.execution.passed).toBe(false);
    expect(res.body.data.execution.actualStatusCode).toBe(500);
  });

  it('runs every test case for an endpoint via the batch endpoint', async () => {
    axios.request.mockResolvedValue({ status: 200, data: [] });

    const res = await request(app)
      .post(`/api/endpoints/${endpointId}/execute`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.executions.length).toBeGreaterThan(0);
  });

  it('lists execution history for a project, most recent first', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectWithServerId}/executions`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.executions.length).toBeGreaterThan(0);
  });

  it("prevents a different user from executing someone else's test case", async () => {
    const otherUser = await request(app).post('/api/auth/register').send({
      name: 'Other User',
      email: 'exec-other@example.com',
      password: 'password123',
    });
    const otherToken = otherUser.body.data.token;

    const res = await request(app)
      .post(`/api/testcases/${testCaseId}/execute`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.statusCode).toBe(404);
  });
});
