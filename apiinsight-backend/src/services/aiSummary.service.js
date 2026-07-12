const OpenAI = require('openai');
const { z } = require('zod');
const ApiError = require('../utils/ApiError');
const { openaiApiKey, openaiModel, aiBaseUrl } = require('../config/env');

// Same lazy-client pattern as aiTestGen.service.js - see that file for the
// full reasoning. Kept separate (not shared) so each service's client
// config can diverge later without entangling the two.
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

const aiResponseShape = z.object({
  summary: z.string().min(1),
  suggestions: z.array(z.string()).min(1),
});

function buildPrompt(stats) {
  return `You are an API quality analyst. Given this test execution summary for an API,
write a short plain-English assessment and concrete suggestions for the developers.

Total endpoints: ${stats.totalEndpoints}
Total test cases run: ${stats.totalTestCases}
Passed: ${stats.passedCount}
Failed: ${stats.failedCount}
Risk score: ${stats.riskScore} / 100 (${stats.riskLevel} risk)
Failures by category: ${JSON.stringify(stats.failuresByCategory)}
Failing endpoints: ${JSON.stringify(stats.failingEndpoints)}

Respond with ONLY a JSON object of this exact shape, no other text:
{
  "summary": "2-4 sentence plain-English summary of the API's overall quality and risk",
  "suggestions": [
    "specific, actionable suggestion referencing an actual failing endpoint or category",
    "..."
  ]
}
Write 3 to 6 suggestions. Prioritize security and negative-case failures over positive/edge ones.`;
}

// The actual OpenAI call, isolated so tests can substitute a fake one
// instead of hitting the network / spending money.
async function defaultChatCompletion(prompt) {
  const client = getClient();

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: openaiModel,
      temperature: 0.4,
      response_format: { type: 'json_object' },
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
 * Generates an AI summary + developer suggestions from execution stats.
 * @param {object} stats - totalEndpoints, totalTestCases, passedCount, failedCount,
 *   riskScore, riskLevel, failuresByCategory, failingEndpoints
 * @param {(prompt: string) => Promise<string>} [chatFn] - injected in tests
 */
async function generateSummaryAndSuggestions(stats, chatFn = defaultChatCompletion) {
  const rawContent = await chatFn(buildPrompt(stats));

  let parsedJson;
  try {
    parsedJson = JSON.parse(rawContent);
  } catch (err) {
    throw new ApiError(502, 'AI returned invalid JSON');
  }

  const result = aiResponseShape.safeParse(parsedJson);
  if (!result.success) {
    throw new ApiError(502, `AI response did not match expected schema: ${result.error.message}`);
  }

  return result.data;
}

module.exports = { generateSummaryAndSuggestions, buildPrompt };
