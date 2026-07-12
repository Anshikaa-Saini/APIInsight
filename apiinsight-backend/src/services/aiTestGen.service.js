const OpenAI = require('openai');
const { z } = require('zod');
const ApiError = require('../utils/ApiError');
const { openaiApiKey, openaiModel, aiBaseUrl } = require('../config/env');

// The client is built lazily (only when a request actually needs it),
// not at module load. This means the rest of the app - and this file's
// unit tests - can run fine even when OPENAI_API_KEY isn't set yet.
//
// aiBaseUrl is optional. When unset, the SDK talks to OpenAI's own API
// as normal. Setting AI_BASE_URL in .env (e.g. to Groq's OpenAI-compatible
// endpoint) redirects the exact same client/prompt/parsing code to a
// different provider - no business logic changes needed to switch.
let cachedClient = null;
function getClient() {
  if (!openaiApiKey) {
    throw new ApiError(500, 'OPENAI_API_KEY is not configured on the server');
  }
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: openaiApiKey, baseURL: aiBaseUrl });
  }
  return cachedClient;
}

// Shape we require every AI-generated test case to match. Trusting a
// third-party model's raw JSON output without validation is asking for
// a corrupt document to slip into the database - this schema is our guard.
//
// Note: smaller/open models (e.g. Groq's Llama models) are noticeably less
// reliable than GPT-4-class models at following a nested JSON shape exactly,
// even with JSON mode forcing valid *syntax*. So this schema is deliberately
// validated per-test-case (see generateTestCasesForEndpoint below) rather
// than all-or-nothing - one malformed item out of 4-8 shouldn't discard
// the rest.
const testCaseShape = z.object({
  title: z.string(),
  category: z.enum(['positive', 'negative', 'edge', 'security']),
  requestPayload: z
    .object({
      headers: z.record(z.any()).optional(),
      query: z.record(z.any()).optional(),
      pathParams: z.record(z.any()).optional(),
      body: z.any().optional(),
    })
    .default({}),
  expectedStatusCode: z.number(),
  expectedBehaviour: z.string(),
});

const aiResponseShape = z.object({
  testCases: z.array(z.unknown()).min(1),
});

function buildPrompt(endpoint) {
  return `You are an expert API test engineer. Given this API endpoint, generate a set of
test cases that a QA engineer would write to check its correctness and robustness.

Endpoint: ${endpoint.method} ${endpoint.path}
Summary: ${endpoint.summary || 'N/A'}
Parameters: ${JSON.stringify(endpoint.parameters || [])}
Request body schema: ${JSON.stringify(endpoint.requestBodySchema || {})}
Documented responses: ${JSON.stringify(endpoint.responses || {})}

Generate 4 to 8 test cases spread across these categories:
- "positive": valid input, expect a successful response
- "negative": invalid/missing required input, expect a client error (4xx)
- "edge": boundary values (empty strings, zero, very long strings, min/max numbers)
- "security": unauthorized access, injection attempts, oversized payloads

Respond with ONLY a JSON object of this exact shape, no other text. Every test case
MUST have all 5 fields shown below, and "requestPayload" MUST have exactly these 4
keys as direct siblings - do NOT nest "query", "pathParams", or "body" inside "headers",
they are separate keys at the same level as "headers":
{
  "testCases": [
    {
      "title": "short human-readable description",
      "category": "positive",
      "requestPayload": {
        "headers": { "Authorization": "Bearer <token>" },
        "query": {},
        "pathParams": {},
        "body": {}
      },
      "expectedStatusCode": 200,
      "expectedBehaviour": "one sentence describing what should happen"
    },
    {
      "title": "another example - rejects request with missing required field",
      "category": "negative",
      "requestPayload": {
        "headers": {},
        "query": {},
        "pathParams": { "id": "123" },
        "body": null
      },
      "expectedStatusCode": 400,
      "expectedBehaviour": "one sentence describing what should happen"
    }
  ]
}`;
}

// The actual OpenAI call, isolated into its own function so tests can
// substitute a fake one instead of hitting the network / spending money.
async function defaultChatCompletion(prompt) {
  const client = getClient();

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: openaiModel,
      temperature: 0.4,
      response_format: { type: 'json_object' }, // forces valid JSON, no markdown fences to strip
      messages: [
        { role: 'system', content: 'You output only valid JSON, nothing else.' },
        { role: 'user', content: prompt },
      ],
    });
  } catch (err) {
    throw new ApiError(502, `AI request failed: ${err.message}`);
  }

  return completion.choices[0]?.message?.content || '';
}

/**
 * Generates AI test cases for one endpoint.
 * @param {object} endpoint - endpoint document (method, path, summary, parameters, requestBodySchema, responses)
 * @param {(prompt: string) => Promise<string>} [chatFn] - injected in tests to avoid real API calls
 */
async function generateTestCasesForEndpoint(endpoint, chatFn = defaultChatCompletion) {
  const rawContent = await chatFn(buildPrompt(endpoint));

  let parsedJson;
  try {
    parsedJson = JSON.parse(rawContent);
  } catch (err) {
    throw new ApiError(502, 'AI returned invalid JSON');
  }

  const envelope = aiResponseShape.safeParse(parsedJson);
  if (!envelope.success) {
    throw new ApiError(502, `AI response did not match expected schema: ${envelope.error.message}`);
  }

  // Validate each test case individually rather than all-or-nothing. Weaker
  // models occasionally get the nested shape wrong on one item out of
  // several - that shouldn't throw away 5 perfectly good test cases along
  // with it. We only fail the whole request if NONE of them are usable.
  const validTestCases = [];
  const rejectedCount = { value: 0 };
  for (const rawItem of envelope.data.testCases) {
    const result = testCaseShape.safeParse(rawItem);
    if (result.success) {
      validTestCases.push(result.data);
    } else {
      rejectedCount.value += 1;
    }
  }

  if (validTestCases.length === 0) {
    throw new ApiError(502, 'AI response did not contain any valid test cases');
  }

  if (rejectedCount.value > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `generateTestCasesForEndpoint: discarded ${rejectedCount.value} malformed test case(s) from AI response, kept ${validTestCases.length}`
    );
  }

  return validTestCases;
}

module.exports = { generateTestCasesForEndpoint };
