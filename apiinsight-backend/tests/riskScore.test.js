const { computeRiskScore } = require('../src/services/riskScore.service');

describe('computeRiskScore', () => {
  it('returns riskScore 100 and Low risk when everything passes', () => {
    const results = [
      { category: 'positive', passed: true },
      { category: 'negative', passed: true },
      { category: 'security', passed: true },
    ];
    expect(computeRiskScore(results)).toEqual({ riskScore: 100, riskLevel: 'Low' });
  });

  it('penalizes a failing security test case more than a failing positive one', () => {
    const securityFailure = computeRiskScore([{ category: 'security', passed: false }]);
    const positiveFailure = computeRiskScore([{ category: 'positive', passed: false }]);

    expect(securityFailure.riskScore).toBeLessThan(positiveFailure.riskScore);
  });

  it('never drops the score below 0 even with many severe failures', () => {
    const manyFailures = Array.from({ length: 20 }, () => ({
      category: 'security',
      passed: false,
    }));
    const result = computeRiskScore(manyFailures);
    expect(result.riskScore).toBe(0);
    expect(result.riskLevel).toBe('Critical');
  });

  it('buckets scores into the correct risk level', () => {
    expect(computeRiskScore([{ category: 'positive', passed: true }]).riskLevel).toBe('Low');

    // 100 - 3*8 = 76 -> Medium
    const medium = computeRiskScore([
      { category: 'negative', passed: false },
      { category: 'negative', passed: false },
      { category: 'negative', passed: false },
    ]);
    expect(medium.riskScore).toBe(76);
    expect(medium.riskLevel).toBe('Medium');
  });

  it('returns riskScore null and riskLevel Unknown when there are no results', () => {
    expect(computeRiskScore([])).toEqual({ riskScore: null, riskLevel: 'Unknown' });
  });

  it('falls back to a default penalty for an unrecognized category', () => {
    const result = computeRiskScore([{ category: 'something-unexpected', passed: false }]);
    expect(result.riskScore).toBe(95); // 100 - default penalty of 5
  });
});
