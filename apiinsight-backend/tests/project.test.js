const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

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
    email: 'spec-test@example.com',
    password: 'password123',
  });
  token = registerRes.body.data.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('Project spec upload API', () => {
  let projectId;

  it('rejects upload without auth', async () => {
    const res = await request(app)
      .post('/api/projects/upload-file')
      .attach('specFile', path.join(__dirname, 'fixtures/sample-petstore.yaml'));
    expect(res.statusCode).toBe(401);
  });

  it('uploads a valid YAML spec and parses endpoints', async () => {
    const res = await request(app)
      .post('/api/projects/upload-file')
      .set('Authorization', `Bearer ${token}`)
      .attach('specFile', path.join(__dirname, 'fixtures/sample-petstore.yaml'));

    expect(res.statusCode).toBe(201);
    expect(res.body.data.project.status).toBe('parsed');
    expect(res.body.data.project.name).toBe('Petstore API');
    expect(res.body.data.project.endpointCount).toBe(3);

    projectId = res.body.data.project._id;
  });

  it('rejects a non-spec file extension', async () => {
    const res = await request(app)
      .post('/api/projects/upload-file')
      .set('Authorization', `Bearer ${token}`)
      .attach('specFile', Buffer.from('hello'), 'notaspec.txt');

    expect(res.statusCode).toBe(400);
  });

  it('lists endpoints for the uploaded project', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/endpoints`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.endpoints).toHaveLength(3);
  });

  it('gets a single endpoint by id', async () => {
    const listRes = await request(app)
      .get(`/api/projects/${projectId}/endpoints`)
      .set('Authorization', `Bearer ${token}`);
    const endpointId = listRes.body.data.endpoints[0]._id;

    const res = await request(app)
      .get(`/api/endpoints/${endpointId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.endpoint.path).toBeDefined();
  });

  it('lists projects for the logged-in user', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.projects.length).toBeGreaterThan(0);
  });

  it("prevents a different user from accessing someone else's project", async () => {
    const otherUser = await request(app).post('/api/auth/register').send({
      name: 'Other User',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherToken = otherUser.body.data.token;

    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.statusCode).toBe(404);
  });

  it('marks a project failed when the spec is invalid', async () => {
    const res = await request(app)
      .post('/api/projects/upload-file')
      .set('Authorization', `Bearer ${token}`)
      .attach('specFile', Buffer.from('{ not valid json'), 'broken.json');

    expect(res.statusCode).toBe(400);
  });

  it('deletes a project and its endpoints', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);

    const getRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.statusCode).toBe(404);
  });
});
