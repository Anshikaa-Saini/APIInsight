const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const projectService = require('../services/project.service');

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded. Attach it under the "specFile" field.');
  }

  const project = await projectService.uploadSpecFile({
    ownerId: req.user._id,
    file: req.file,
  });

  sendSuccess(res, 201, { project }, 'Spec parsed and project created successfully');
});

const uploadUrl = asyncHandler(async (req, res) => {
  const { url } = req.body;

  const project = await projectService.uploadSpecUrl({
    ownerId: req.user._id,
    url,
  });

  sendSuccess(res, 201, { project }, 'Spec parsed and project created successfully');
});

const listProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.listProjects(req.user._id);
  sendSuccess(res, 200, { projects });
});

const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getOwnedProject(req.params.projectId, req.user._id);
  sendSuccess(res, 200, { project });
});

const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.projectId, req.user._id);
  sendSuccess(res, 200, null, 'Project deleted');
});

const updateBaseUrl = asyncHandler(async (req, res) => {
  const project = await projectService.updateBaseUrl(
    req.params.projectId,
    req.user._id,
    req.body.baseUrl
  );
  sendSuccess(res, 200, { project }, 'Base URL updated');
});

module.exports = {
  uploadFile,
  uploadUrl,
  listProjects,
  getProject,
  deleteProject,
  updateBaseUrl,
};
