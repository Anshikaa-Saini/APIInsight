const axios = require('axios');

/**
 * Builds a real HTTP request from an endpoint + AI-generated test case, and
 * sends it to the project's target base URL.
 *
 * Deliberately never throws for a "normal" HTTP response, even 4xx/5xx -
 * those are exactly the outcomes we're here to record and compare against
 * the test case's expectedStatusCode. Only a request that never got a
 * response at all (network error, DNS failure, timeout) is treated as a
 * failure in the catch branch below.
 *
 * @param {object} params
 * @param {string} params.baseUrl - project's target API base URL
 * @param {object} params.endpoint - endpoint document (path, method)
 * @param {object} params.testCase - test case document (requestPayload, expectedStatusCode)
 * @param {Function} [requestFn] - injected in tests to avoid real network calls
 */
async function executeTestCase({ baseUrl, endpoint, testCase }, requestFn = axios.request) {
  const url = buildUrl(baseUrl, endpoint.path, testCase.requestPayload?.pathParams);
  const startedAt = Date.now();

  try {
    const response = await requestFn({
      url,
      method: endpoint.method,
      params: testCase.requestPayload?.query || {},
      headers: testCase.requestPayload?.headers || {},
      data: testCase.requestPayload?.body ?? undefined,
      timeout: 10000,
      // We want to inspect ANY status code ourselves (including 4xx/5xx),
      // not have axios throw on them.
      validateStatus: () => true,
    });

    return {
      actualStatusCode: response.status,
      actualResponseBody: safeTruncate(response.data),
      responseTimeMs: Date.now() - startedAt,
      passed: response.status === testCase.expectedStatusCode,
      errorMessage: '',
    };
  } catch (err) {
    return {
      actualStatusCode: null,
      actualResponseBody: null,
      responseTimeMs: Date.now() - startedAt,
      passed: false,
      errorMessage: err.message,
    };
  }
}

/**
 * Substitutes {pathParam} placeholders in the endpoint's path template with
 * values from the test case, then joins it onto the project's base URL.
 */
function buildUrl(baseUrl, pathTemplate, pathParams = {}) {
  let path = pathTemplate;
  for (const [key, value] of Object.entries(pathParams || {})) {
    path = path.replace(`{${key}}`, encodeURIComponent(value));
  }
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

// A third-party API's response body could be huge or awkward to store -
// cap what actually gets persisted so one bad response can't bloat the DB.
const MAX_STORED_RESPONSE_CHARS = 5000;
function safeTruncate(data) {
  if (data === undefined || data === null) return null;

  const json = JSON.stringify(data);
  if (json.length <= MAX_STORED_RESPONSE_CHARS) return data;

  return { truncated: true, preview: json.slice(0, MAX_STORED_RESPONSE_CHARS) };
}

module.exports = { executeTestCase, buildUrl };
