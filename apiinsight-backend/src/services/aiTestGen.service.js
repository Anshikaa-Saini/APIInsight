const OpenAI = require("openai");
const { z } = require("zod");
const ApiError = require("../utils/ApiError");
const { openaiApiKey, openaiModel, aiBaseUrl } = require("../config/env");

// The client is built lazily (only when a request actually needs it),
// not at module load. This means the rest of the app - and this file's
// unit tests - can run fine even when OPENAI_API_KEY isn't set yet.
let cachedClient = null;
function getClient() {
  if (!openaiApiKey) {
    throw new ApiError(500, "OPENAI_API_KEY is not configured on the server");
  }
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: openaiApiKey, baseURL: aiBaseUrl });
  }
  return cachedClient;
}

// Shape we require every AI-generated test case to match. Trusting a
// third-party model's raw JSON output without validation is asking for
// a corrupt document to slip into the database - this schema is our guard.
const testCaseShape = z.object({
  title: z.string(),
  category: z.enum(["positive", "negative", "edge", "security"]),
  requestPayload: z
    .object({
      headers: z.record(z.string()).optional(),
      query: z.record(z.any()).optional(),
      pathParams: z.record(z.any()).optional(),
      body: z.any().optional(),
    })
    .default({}),
  expectedStatusCode: z.number(),
  expectedBehaviour: z.string(),
});

const aiResponseShape = z.object({
  testCases: z.array(testCaseShape).min(1),
});

function buildPrompt(endpoint) {
  return `You are an expert API test engineer. Given this API endpoint, generate a set of
test cases that a QA engineer would write to check its correctness and robustness.

Endpoint: ${endpoint.method} ${endpoint.path}
Summary: ${endpoint.summary || "N/A"}
Parameters: ${JSON.stringify(endpoint.parameters || [])}
Request body schema: ${JSON.stringify(endpoint.requestBodySchema || {})}
Documented responses: ${JSON.stringify(endpoint.responses || {})}

Generate 4 to 8 test cases spread across these categories:
- "positive": valid input, expect a successful response
- "negative": invalid/missing required input, expect a client error (4xx)
- "edge": boundary values (empty strings, zero, very long strings, min/max numbers)
- "security": unauthorized access, injection attempts, oversized payloads

Respond with ONLY a JSON object of this exact shape, no other text:
{
  "testCases": [
    {
      "title": "short human-readable description",
      "category": "positive" | "negative" | "edge" | "security",
      "requestPayload": {
        "headers": { "Authorization": "Bearer <token>" },
        "query": {},
        "pathParams": {},
        "body": {}
      },
      "expectedStatusCode": 200,
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
      response_format: { type: "json_object" }, // forces valid JSON, no markdown fences to strip
      messages: [
        {
          role: "system",
          content: "You output only valid JSON, nothing else.",
        },
        { role: "user", content: prompt },
      ],
    });
  } catch (err) {
    throw new ApiError(502, `OpenAI request failed: ${err.message}`);
  }

  return completion.choices[0]?.message?.content || "";
}

/**
 * Generates AI test cases for one endpoint.
 * @param {object} endpoint - endpoint document (method, path, summary, parameters, requestBodySchema, responses)
 * @param {(prompt: string) => Promise<string>} [chatFn] - injected in tests to avoid real API calls
 */
async function generateTestCasesForEndpoint(
  endpoint,
  chatFn = defaultChatCompletion,
) {
  const rawContent = await chatFn(buildPrompt(endpoint));

  let parsedJson;
  try {
    parsedJson = JSON.parse(rawContent);
  } catch (err) {
    throw new ApiError(502, "AI returned invalid JSON");
  }

  const result = aiResponseShape.safeParse(parsedJson);
  if (!result.success) {
    throw new ApiError(
      502,
      `AI response did not match expected schema: ${result.error.message}`,
    );
  }

  return result.data.testCases;
}

module.exports = { generateTestCasesForEndpoint };
