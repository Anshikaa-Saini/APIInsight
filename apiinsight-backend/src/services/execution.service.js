const Execution = require('../models/Execution');
const TestCase = require('../models/TestCase');
const Endpoint = require('../models/Endpoint');
const ApiError = require('../utils/ApiError');
const executorService = require('./executor.service');
const projectService = require('./project.service');

// Shared by every run path: execute one test case against the target API,
// then persist the result. Kept as its own function so runTestCase,
// runEndpoint, and runProject don't each repeat this pairing.
async function executeAndSave(testCase, endpoint, project) {
  const result = await executorService.executeTestCase({
    baseUrl: project.baseUrl,
    endpoint,
    testCase,
  });

  return Execution.create({
    testCase: testCase._id,
    endpoint: endpoint._id,
    project: project._id,
    ...result,
  });
}

function assertHasBaseUrl(project) {
  if (!project.baseUrl) {
    throw new ApiError(
      400,
      'This project has no target base URL set. Set one before running tests.'
    );
  }
}

async function runTestCase(ownerId, testCaseId) {
  const testCase = await TestCase.findById(testCaseId);
  if (!testCase) {
    throw new ApiError(404, 'Test case not found');
  }

  const project = await projectService.getOwnedProject(testCase.project, ownerId);
  assertHasBaseUrl(project);

  const endpoint = await Endpoint.findById(testCase.endpoint);
  if (!endpoint) {
    throw new ApiError(404, 'Endpoint not found for this test case');
  }

  return executeAndSave(testCase, endpoint, project);
}

// Runs every test case belonging to one endpoint. Sequential, not
// parallel - this endpoint likely belongs to someone else's API, and
// firing a burst of concurrent requests at it is exactly the kind of
// thing this tool exists to catch, not cause.
async function runEndpoint(ownerId, endpointId) {
  const endpoint = await Endpoint.findById(endpointId);
  if (!endpoint) {
    throw new ApiError(404, 'Endpoint not found');
  }

  const project = await projectService.getOwnedProject(endpoint.project, ownerId);
  assertHasBaseUrl(project);

  const testCases = await TestCase.find({ endpoint: endpointId });

  const executions = [];
  for (const testCase of testCases) {
    executions.push(await executeAndSave(testCase, endpoint, project));
  }
  return executions;
}

// Runs every test case across every endpoint in a project. Same
// sequential approach as runEndpoint, and for the same reason.
async function runProject(ownerId, projectId) {
  const project = await projectService.getOwnedProject(projectId, ownerId);
  assertHasBaseUrl(project);

  const testCases = await TestCase.find({ project: projectId });
  const endpoints = await Endpoint.find({ project: projectId });
  const endpointById = new Map(endpoints.map((e) => [String(e._id), e]));

  const executions = [];
  for (const testCase of testCases) {
    const endpoint = endpointById.get(String(testCase.endpoint));
    if (!endpoint) continue; // shouldn't normally happen; don't let one bad reference kill the run

    executions.push(await executeAndSave(testCase, endpoint, project));
  }
  return executions;
}

async function listForProject(ownerId, projectId) {
  await projectService.getOwnedProject(projectId, ownerId);
  return Execution.find({ project: projectId }).sort({ executedAt: -1 });
}

async function listForEndpoint(ownerId, endpointId) {
  const endpoint = await Endpoint.findById(endpointId);
  if (!endpoint) {
    throw new ApiError(404, 'Endpoint not found');
  }
  await projectService.getOwnedProject(endpoint.project, ownerId);

  return Execution.find({ endpoint: endpointId }).sort({ executedAt: -1 });
}

module.exports = { runTestCase, runEndpoint, runProject, listForProject, listForEndpoint };
