process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/apiinsight-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

const { keepLatestPerTestCase } = require('../src/services/report.service');

describe('keepLatestPerTestCase', () => {
  it('keeps only the most recent execution per test case', () => {
    // Executions are expected sorted most-recent-first (as Execution.find()
    // .sort({ executedAt: -1 }) would return them) - the first one seen
    // per test case id is the one that should win.
    const executions = [
      { testCase: 'tc1', passed: true, executedAt: new Date('2026-01-03') }, // latest for tc1
      { testCase: 'tc1', passed: false, executedAt: new Date('2026-01-02') }, // stale, ignored
      { testCase: 'tc2', passed: false, executedAt: new Date('2026-01-01') },
    ];

    const result = keepLatestPerTestCase(executions);

    expect(result).toHaveLength(2);
    expect(result.find((e) => e.testCase === 'tc1').passed).toBe(true);
    expect(result.find((e) => e.testCase === 'tc2').passed).toBe(false);
  });

  it('returns an empty array when given no executions', () => {
    expect(keepLatestPerTestCase([])).toEqual([]);
  });

  it('handles ObjectId-like values by comparing their string form', () => {
    // Mongoose ObjectIds aren't strictly equal by reference even when they
    // represent the same id, so the helper must compare via String().
    const fakeObjectId = (hex) => ({ toString: () => hex });

    const executions = [
      { testCase: fakeObjectId('abc123'), passed: true },
      { testCase: fakeObjectId('abc123'), passed: false }, // same id, different instance
    ];

    const result = keepLatestPerTestCase(executions);
    expect(result).toHaveLength(1);
    expect(result[0].passed).toBe(true);
  });
});
