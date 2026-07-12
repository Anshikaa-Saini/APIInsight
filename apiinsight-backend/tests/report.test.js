const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Both aiTestGen.service.js and aiSummary.service.js construct their own
// `new OpenAI(...)` client. Mocking the module so every instance shares the
// same `create` mock lets us control the AI's response from these tests
// without making a real network call or spending real tokens.
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }));
});

let app;
let mongoServer;
let token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test_secret';
  process.env.OPENAI_API_KEY = 'fake-key-for-tests';

  await mongoose.connect(process.env.MONGO_URI);
  app = require('../src/app');

  const registerRes = await request(app).post('/api/auth/register').send({
    name: 'Test User',
    email: 'report-test@example.com',
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
  mockCreate.mockClear();
});

function mockAiSummaryResponse(summary, suggestions) {
  mockCreate.mockResolvedValueOnce({
    choices: [{ message: { content: JSON.stringify({ summary, suggestions }) } }],
  });
}

describe('Report API', () => {
  let projectId;
  let endpointId;

  it('sets up a project with test cases and mixed pass/fail executions', async () => {
    const uploadRes = await request(app)
      .post('/api/projects/upload-file')
      .set('Authorization', `Bearer ${token}`)
      .attach('specFile', path.join(__dirname, 'fixtures/sample-petstore-with-server.yaml'));
    projectId = uploadRes.body.data.project._id;

    const endpointsRes = await request(app)
      .get(`/api/projects/${projectId}/endpoints`)
      .set('Authorization', `Bearer ${token}`);
    endpointId = endpointsRes.body.data.endpoints[0]._id;

    // Insert test cases + executions directly (bypassing AI generation and
    // the real executor) so the risk score for this test is deterministic
    // and known ahead of time: 1 failing security + 1 failing negative +
    // 1 passing positive => 100 - 15 - 8 = 77 ("Medium").
    const TestCase = require('../src/models/TestCase');
    const Execution = require('../src/models/Execution');

    const tcSecurity = await TestCase.create({
      endpoint: endpointId,
      project: projectId,
      title: 'Rejects missing auth',
      category: 'security',
      requestPayload: {},
      expectedStatusCode: 401,
      generatedBy: 'manual',
    });
    const tcNegative = await TestCase.create({
      endpoint: endpointId,
      project: projectId,
      title: 'Rejects missing name field',
      category: 'negative',
      requestPayload: {},
      expectedStatusCode: 400,
      generatedBy: 'manual',
    });
    const tcPositive = await TestCase.create({
      endpoint: endpointId,
      project: projectId,
      title: 'Lists pets successfully',
      category: 'positive',
      requestPayload: {},
      expectedStatusCode: 200,
      generatedBy: 'manual',
    });

    await Execution.create({
      testCase: tcSecurity._id,
      endpoint: endpointId,
      project: projectId,
      actualStatusCode: 200, // expected 401, so this fails
      passed: false,
    });
    await Execution.create({
      testCase: tcNegative._id,
      endpoint: endpointId,
      project: projectId,
      actualStatusCode: 200, // expected 400, so this fails
      passed: false,
    });
    await Execution.create({
      testCase: tcPositive._id,
      endpoint: endpointId,
      project: projectId,
      actualStatusCode: 200, // expected 200, passes
      passed: true,
    });
  });

  it('refuses to generate a report for a project with zero executions', async () => {
    const emptyUploadRes = await request(app)
      .post('/api/projects/upload-file')
      .set('Authorization', `Bearer ${token}`)
      .attach('specFile', path.join(__dirname, 'fixtures/sample-petstore.yaml'));
    const emptyProjectId = emptyUploadRes.body.data.project._id;

    const res = await request(app)
      .post(`/api/projects/${emptyProjectId}/generate-report`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/no test executions/i);
  });

  it('generates a report with the correct risk score and the AI summary/suggestions', async () => {
    mockAiSummaryResponse('The API has a moderate risk level driven by an auth failure.', [
      'Add an auth check to the affected endpoint.',
      'Validate required fields before accepting requests.',
    ]);

    const res = await request(app)
      .post(`/api/projects/${projectId}/generate-report`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(201);
    const report = res.body.data.report;
    expect(report.riskScore).toBe(77); // 100 - 15 (security) - 8 (negative)
    expect(report.riskLevel).toBe('Medium');
    expect(report.passedCount).toBe(1);
    expect(report.failedCount).toBe(2);
    expect(report.aiSummary).toMatch(/moderate risk/);
    expect(report.suggestions).toHaveLength(2);
  });

  it('fetches the latest report', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/report`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.report.riskScore).toBe(77);
  });

  it('lists report history, most recent first', async () => {
    mockAiSummaryResponse('Second run summary.', ['Some other suggestion.']);
    await request(app)
      .post(`/api/projects/${projectId}/generate-report`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get(`/api/projects/${projectId}/reports/history`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.reports.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.reports[0].aiSummary).toBe('Second run summary.');
  });

  it("prevents a different user from generating or viewing someone else's report", async () => {
    const otherUser = await request(app).post('/api/auth/register').send({
      name: 'Other User',
      email: 'report-other@example.com',
      password: 'password123',
    });
    const otherToken = otherUser.body.data.token;

    const genRes = await request(app)
      .post(`/api/projects/${projectId}/generate-report`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(genRes.statusCode).toBe(404);

    const getRes = await request(app)
      .get(`/api/projects/${projectId}/report`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(getRes.statusCode).toBe(404);
  });
});
