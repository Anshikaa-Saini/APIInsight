const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Endpoint = require('../models/Endpoint');
const projectService = require('../services/project.service');

// Lists all endpoints for a project. Ownership is enforced by re-using
// getOwnedProject - if the project doesn't belong to this user, that
// throws a 404 before we even look at endpoints.
const listEndpoints = asyncHandler(async (req, res) => {
  const project = await projectService.getOwnedProject(req.params.projectId, req.user._id);
  const endpoints = await Endpoint.find({ project: project._id }).sort({ path: 1, method: 1 });
  sendSuccess(res, 200, { endpoints });
});

const getEndpoint = asyncHandler(async (req, res) => {
  const endpoint = await Endpoint.findById(req.params.endpointId);
  if (!endpoint) {
    throw new ApiError(404, 'Endpoint not found');
  }

  // Ownership is checked via the parent project - a user should only be
  // able to view endpoints that belong to one of their own projects.
  await projectService.getOwnedProject(endpoint.project, req.user._id);

  sendSuccess(res, 200, { endpoint });
});

module.exports = { listEndpoints, getEndpoint };
