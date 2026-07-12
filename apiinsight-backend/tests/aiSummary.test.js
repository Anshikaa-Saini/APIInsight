process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/apiinsight-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

const { generateSummaryAndSuggestions } = require('../src/services/aiSummary.service');

const sampleStats = {
  totalEndpoints: 3,
  totalTestCases: 10,
  passedCount: 7,
  failedCount: 3,
  riskScore: 68,
  riskLevel: 'Medium',
  failuresByCategory: { security: 1, negative: 2 },
  failingEndpoints: [{ method: 'POST', path: '/pets', testCaseTitle: 'Missing auth header' }],
};

describe('generateSummaryAndSuggestions', () => {
  it('parses and validates a well-formed AI response', async () => {
    const fakeChat = jest.fn().mockResolvedValue(
      JSON.stringify({
        summary: 'The API has a moderate risk level due to a security failure on POST /pets.',
        suggestions: [
          'Add authentication checks to POST /pets before accepting requests.',
          'Add validation for missing required fields.',
        ],
      })
    );

    const result = await generateSummaryAndSuggestions(sampleStats, fakeChat);

    expect(result.summary).toMatch(/moderate risk/);
    expect(result.suggestions).toHaveLength(2);
    expect(fakeChat).toHaveBeenCalledTimes(1);
    // Sanity check the prompt actually includes the stats
    expect(fakeChat.mock.calls[0][0]).toContain('Risk score: 68');
    expect(fakeChat.mock.calls[0][0]).toContain('"path":"/pets"');
  });

  it('throws a clear error when the AI returns invalid JSON', async () => {
    const fakeChat = jest.fn().mockResolvedValue('not json at all');

    await expect(generateSummaryAndSuggestions(sampleStats, fakeChat)).rejects.toThrow(
      'AI returned invalid JSON'
    );
  });

  it('throws when the AI response is missing suggestions', async () => {
    const fakeChat = jest.fn().mockResolvedValue(JSON.stringify({ summary: 'Looks fine.' }));

    await expect(generateSummaryAndSuggestions(sampleStats, fakeChat)).rejects.toThrow(
      /did not match expected schema/
    );
  });

  it('throws when the AI returns an empty suggestions list', async () => {
    const fakeChat = jest.fn().mockResolvedValue(
      JSON.stringify({ summary: 'Looks fine.', suggestions: [] })
    );

    await expect(generateSummaryAndSuggestions(sampleStats, fakeChat)).rejects.toThrow(
      /did not match expected schema/
    );
  });

  it('wraps a failed chat call in a clear error', async () => {
    const fakeChat = jest.fn().mockRejectedValue(new Error('rate limit exceeded'));

    await expect(generateSummaryAndSuggestions(sampleStats, fakeChat)).rejects.toThrow(
      'rate limit exceeded'
    );
  });
});
