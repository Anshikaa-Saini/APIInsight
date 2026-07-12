// These tests don't touch MongoDB, but src/config/env.js exits the process
// if MONGO_URI/JWT_SECRET are missing (by design, for the real server).
// Set harmless placeholders so requiring the service doesn't crash the test run.
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/apiinsight-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

const { generateTestCasesForEndpoint } = require('../src/services/aiTestGen.service');

const sampleEndpoint = {
  method: 'POST',
  path: '/pets',
  summary: 'Create a pet',
  parameters: [],
  requestBodySchema: {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
  },
  responses: { 201: { description: 'Created' } },
};

describe('generateTestCasesForEndpoint', () => {
  it('parses and validates a well-formed AI response', async () => {
    const fakeChat = jest.fn().mockResolvedValue(
      JSON.stringify({
        testCases: [
          {
            title: 'Creates a pet with a valid body',
            category: 'positive',
            requestPayload: { body: { name: 'Rex' } },
            expectedStatusCode: 201,
            expectedBehaviour: 'The pet is created and returned in the response',
          },
          {
            title: 'Missing required name field',
            category: 'negative',
            requestPayload: { body: {} },
            expectedStatusCode: 400,
            expectedBehaviour: 'A validation error is returned',
          },
        ],
      })
    );

    const testCases = await generateTestCasesForEndpoint(sampleEndpoint, fakeChat);

    expect(testCases).toHaveLength(2);
    expect(testCases[0].category).toBe('positive');
    expect(testCases[1].expectedStatusCode).toBe(400);
    expect(fakeChat).toHaveBeenCalledTimes(1);
    // Sanity check the prompt actually includes the endpoint details
    expect(fakeChat.mock.calls[0][0]).toContain('POST /pets');
  });

  it('throws a clear error when the AI returns invalid JSON', async () => {
    const fakeChat = jest.fn().mockResolvedValue('this is not json');

    await expect(generateTestCasesForEndpoint(sampleEndpoint, fakeChat)).rejects.toThrow(
      'AI returned invalid JSON'
    );
  });

  it('throws when the AI JSON does not match the expected schema', async () => {
    // Missing required fields like expectedStatusCode
    const fakeChat = jest.fn().mockResolvedValue(JSON.stringify({ testCases: [{ title: 'x' }] }));

    await expect(generateTestCasesForEndpoint(sampleEndpoint, fakeChat)).rejects.toThrow(
      /did not match expected schema/
    );
  });

  it('throws when the AI returns an empty test case list', async () => {
    const fakeChat = jest.fn().mockResolvedValue(JSON.stringify({ testCases: [] }));

    await expect(generateTestCasesForEndpoint(sampleEndpoint, fakeChat)).rejects.toThrow(
      /did not match expected schema/
    );
  });

  it('wraps a failed chat call (e.g. rate limit/network error) in a clear ApiError', async () => {
    const fakeChat = jest.fn().mockRejectedValue(new Error('rate limit exceeded'));

    await expect(generateTestCasesForEndpoint(sampleEndpoint, fakeChat)).rejects.toThrow(
      'rate limit exceeded'
    );
  });
});
