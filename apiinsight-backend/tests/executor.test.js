const { executeTestCase, buildUrl } = require('../src/services/executor.service');

describe('buildUrl', () => {
  it('substitutes path params into the path template', () => {
    const url = buildUrl('https://api.example.com', '/pets/{id}', { id: '42' });
    expect(url).toBe('https://api.example.com/pets/42');
  });

  it('strips a trailing slash from the base URL before joining', () => {
    const url = buildUrl('https://api.example.com/', '/pets', {});
    expect(url).toBe('https://api.example.com/pets');
  });

  it('leaves the path unchanged when there are no path params', () => {
    const url = buildUrl('https://api.example.com', '/pets', undefined);
    expect(url).toBe('https://api.example.com/pets');
  });
});

describe('executeTestCase', () => {
  const endpoint = { path: '/pets/{id}', method: 'GET' };
  const testCase = {
    requestPayload: { pathParams: { id: '42' }, query: {}, headers: {}, body: null },
    expectedStatusCode: 200,
  };

  it('marks passed=true when the actual status matches expectedStatusCode', async () => {
    const fakeRequest = jest.fn().mockResolvedValue({ status: 200, data: { id: '42' } });

    const result = await executeTestCase(
      { baseUrl: 'https://api.example.com', endpoint, testCase },
      fakeRequest
    );

    expect(result.passed).toBe(true);
    expect(result.actualStatusCode).toBe(200);
    expect(result.errorMessage).toBe('');
    expect(fakeRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://api.example.com/pets/42',
        method: 'GET',
        validateStatus: expect.any(Function),
      })
    );
  });

  it('marks passed=false when the actual status does not match expectedStatusCode', async () => {
    const fakeRequest = jest.fn().mockResolvedValue({ status: 404, data: { error: 'not found' } });

    const result = await executeTestCase(
      { baseUrl: 'https://api.example.com', endpoint, testCase },
      fakeRequest
    );

    expect(result.passed).toBe(false);
    expect(result.actualStatusCode).toBe(404);
  });

  it('records a network failure (no response at all) with a null status code', async () => {
    const fakeRequest = jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED'));

    const result = await executeTestCase(
      { baseUrl: 'https://api.example.com', endpoint, testCase },
      fakeRequest
    );

    expect(result.passed).toBe(false);
    expect(result.actualStatusCode).toBeNull();
    expect(result.errorMessage).toMatch(/ECONNREFUSED/);
  });

  it('truncates an oversized response body instead of storing it whole', async () => {
    const hugeString = 'x'.repeat(10000);
    const fakeRequest = jest.fn().mockResolvedValue({ status: 200, data: { blob: hugeString } });

    const result = await executeTestCase(
      { baseUrl: 'https://api.example.com', endpoint, testCase },
      fakeRequest
    );

    expect(result.actualResponseBody.truncated).toBe(true);
    expect(result.actualResponseBody.preview.length).toBeLessThanOrEqual(5000);
  });

  it('records response time as a number', async () => {
    const fakeRequest = jest.fn().mockResolvedValue({ status: 200, data: {} });

    const result = await executeTestCase(
      { baseUrl: 'https://api.example.com', endpoint, testCase },
      fakeRequest
    );

    expect(typeof result.responseTimeMs).toBe('number');
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
  });
});
