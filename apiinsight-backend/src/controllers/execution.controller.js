const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const executionService = require('../services/execution.service');

const runTestCase = asyncHandler(async (req, res) => {
  const execution = await executionService.runTestCase(req.user._id, req.params.testCaseId);
  sendSuccess(res, 201, { execution }, 'Test case executed');
});

const runEndpoint = asyncHandler(async (req, res) => {
  const executions = await executionService.runEndpoint(req.user._id, req.params.endpointId);
  sendSuccess(res, 201, { executions }, 'Test cases executed for endpoint');
});

const runProject = asyncHandler(async (req, res) => {
  const executions = await executionService.runProject(req.user._id, req.params.projectId);
  sendSuccess(res, 201, { executions }, 'Test cases executed for project');
});

const listForProject = asyncHandler(async (req, res) => {
  const executions = await executionService.listForProject(req.user._id, req.params.projectId);
  sendSuccess(res, 200, { executions });
});

const listForEndpoint = asyncHandler(async (req, res) => {
  const executions = await executionService.listForEndpoint(req.user._id, req.params.endpointId);
  sendSuccess(res, 200, { executions });
});

module.exports = { runTestCase, runEndpoint, runProject, listForProject, listForEndpoint };
