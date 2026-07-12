const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const testCaseService = require('../services/testcase.service');

const generateForEndpoint = asyncHandler(async (req, res) => {
  const testCases = await testCaseService.generateForEndpoint(req.user._id, req.params.endpointId);
  sendSuccess(res, 201, { testCases }, 'Test cases generated for endpoint');
});

const generateForProject = asyncHandler(async (req, res) => {
  const results = await testCaseService.generateForProject(req.user._id, req.params.projectId);
  sendSuccess(res, 201, { results }, 'Test case generation completed for project');
});

const listForEndpoint = asyncHandler(async (req, res) => {
  const testCases = await testCaseService.listForEndpoint(req.user._id, req.params.endpointId);
  sendSuccess(res, 200, { testCases });
});

module.exports = { generateForEndpoint, generateForProject, listForEndpoint };
