const Report = require('../models/Report');
const Execution = require('../models/Execution');
const TestCase = require('../models/TestCase');
const Endpoint = require('../models/Endpoint');
const ApiError = require('../utils/ApiError');
const projectService = require('./project.service');
const riskScoreService = require('./riskScore.service');
const aiSummaryService = require('./aiSummary.service');

// Cap how many failing endpoints go into the AI prompt - a project with
// hundreds of failures doesn't need all of them listed to get a useful
// summary, and it keeps the prompt (and cost) bounded.
const MAX_FAILING_ENDPOINTS_IN_PROMPT = 20;

/**
 * Only the most recent execution per test case counts toward a report -
 * otherwise re-running tests after fixing a bug would double-count the
 * old failing runs alongside the new passing ones.
 */
function keepLatestPerTestCase(executions) {
  const latestByTestCase = new Map();
  for (const execution of executions) {
    const key = String(execution.testCase);
    if (!latestByTestCase.has(key)) {
      latestByTestCase.set(key, execution);
    }
  }
  return [...latestByTestCase.values()];
}

async function generateReport(ownerId, projectId) {
  const project = await projectService.getOwnedProject(projectId, ownerId);

  const [totalEndpoints, testCases, allExecutions, endpoints] = await Promise.all([
    Endpoint.countDocuments({ project: projectId }),
    TestCase.find({ project: projectId }).select('_id category title'),
    Execution.find({ project: projectId }).sort({ executedAt: -1 }),
    Endpoint.find({ project: projectId }).select('_id method path'),
  ]);

  const latestExecutions = keepLatestPerTestCase(allExecutions);

  if (latestExecutions.length === 0) {
    throw new ApiError(
      400,
      'No test executions found for this project. Run tests before generating a report.'
    );
  }

  const testCaseById = new Map(testCases.map((tc) => [String(tc._id), tc]));
  const endpointById = new Map(endpoints.map((e) => [String(e._id), e]));

  const resultsForScoring = latestExecutions.map((execution) => ({
    category: testCaseById.get(String(execution.testCase))?.category || 'positive',
    passed: execution.passed,
  }));

  const { riskScore, riskLevel } = riskScoreService.computeRiskScore(resultsForScoring);

  const passedCount = latestExecutions.filter((e) => e.passed).length;
  const failedCount = latestExecutions.length - passedCount;

  const failuresByCategory = {};
  for (const result of resultsForScoring) {
    if (!result.passed) {
      failuresByCategory[result.category] = (failuresByCategory[result.category] || 0) + 1;
    }
  }

  const failingEndpoints = latestExecutions
    .filter((execution) => !execution.passed)
    .map((execution) => {
      const endpoint = endpointById.get(String(execution.endpoint));
      const testCase = testCaseById.get(String(execution.testCase));
      return endpoint
        ? { method: endpoint.method, path: endpoint.path, testCaseTitle: testCase?.title }
        : null;
    })
    .filter(Boolean)
    .slice(0, MAX_FAILING_ENDPOINTS_IN_PROMPT);

  const stats = {
    totalEndpoints,
    totalTestCases: latestExecutions.length,
    passedCount,
    failedCount,
    riskScore,
    riskLevel,
    failuresByCategory,
    failingEndpoints,
  };

  const { summary, suggestions } = await aiSummaryService.generateSummaryAndSuggestions(stats);

  return Report.create({
    project: project._id,
    totalEndpoints,
    totalTestCases: stats.totalTestCases,
    passedCount,
    failedCount,
    riskScore,
    riskLevel,
    aiSummary: summary,
    suggestions,
  });
}

async function getLatestReport(ownerId, projectId) {
  await projectService.getOwnedProject(projectId, ownerId);

  const report = await Report.findOne({ project: projectId }).sort({ generatedAt: -1 });
  if (!report) {
    throw new ApiError(404, 'No report has been generated for this project yet');
  }
  return report;
}

async function getReportHistory(ownerId, projectId) {
  await projectService.getOwnedProject(projectId, ownerId);
  return Report.find({ project: projectId }).sort({ generatedAt: -1 });
}

module.exports = {
  generateReport,
  getLatestReport,
  getReportHistory,
  keepLatestPerTestCase,
};
