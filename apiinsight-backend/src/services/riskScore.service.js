/**
 * Computes a project's risk score from its test execution results.
 *
 * Deliberately NOT AI-generated: the score itself is a simple, deterministic
 * formula so it's explainable and reproducible - the same inputs always
 * give the same score, and anyone can verify the math by hand. AI is only
 * used later (aiSummary.service.js) to turn these numbers into a written
 * narrative and suggestions - never to decide the number itself.
 *
 * A failing "security" test case indicates a much more serious problem
 * than a failing "positive" one, so failures are weighted by category
 * rather than treated as equally bad.
 */
const CATEGORY_PENALTY = {
  security: 15,
  negative: 8,
  edge: 6,
  positive: 4,
};
const DEFAULT_PENALTY = 5; // fallback for any unrecognized category

const RISK_LEVEL_THRESHOLDS = [
  { min: 80, level: 'Low' },
  { min: 60, level: 'Medium' },
  { min: 40, level: 'High' },
  { min: 0, level: 'Critical' },
];

/**
 * @param {Array<{ category: string, passed: boolean }>} results - one entry
 *   per test case's latest execution result.
 * @returns {{ riskScore: number, riskLevel: string } | { riskScore: null, riskLevel: 'Unknown' }}
 */
function computeRiskScore(results) {
  if (!results || results.length === 0) {
    return { riskScore: null, riskLevel: 'Unknown' };
  }

  let score = 100;
  for (const result of results) {
    if (!result.passed) {
      score -= CATEGORY_PENALTY[result.category] ?? DEFAULT_PENALTY;
    }
  }
  score = Math.max(0, Math.min(100, score));

  return { riskScore: score, riskLevel: bucketRiskLevel(score) };
}

function bucketRiskLevel(score) {
  return RISK_LEVEL_THRESHOLDS.find((bucket) => score >= bucket.min).level;
}

module.exports = { computeRiskScore, CATEGORY_PENALTY };
