const path = require('path');
const Project = require('../models/Project');
const Endpoint = require('../models/Endpoint');
const ApiError = require('../utils/ApiError');
const specParserService = require('./specParser.service');

async function uploadSpecFile({ ownerId, file }) {
  const ext = path.extname(file.originalname).toLowerCase();
  const format = ext === '.json' ? 'json' : 'yaml';
  const rawText = file.buffer.toString('utf-8');

  const project = await Project.create({
    owner: ownerId,
    name: file.originalname,
    sourceType: format,
    status: 'processing',
  });

  return finalizeProjectFromSpec(project, () =>
    specParserService.parseSpecContent(rawText, format)
  );
}

async function uploadSpecUrl({ ownerId, url }) {
  const project = await Project.create({
    owner: ownerId,
    name: url,
    sourceType: 'url',
    sourceUrl: url,
    status: 'processing',
  });

  return finalizeProjectFromSpec(project, () => specParserService.parseSpecFromUrl(url));
}

/**
 * Shared finishing step for both upload paths: run the parser, and
 * either persist the extracted endpoints and mark the project "parsed",
 * or mark it "failed" with a readable reason. The project row already
 * exists at this point (created as "processing"), so failures are still
 * visible to the user instead of silently disappearing.
 */
async function finalizeProjectFromSpec(project, parseFn) {
  try {
    const { title, version, baseUrl, endpoints } = await parseFn();

    const endpointDocs =
      endpoints.length > 0
        ? await Endpoint.insertMany(endpoints.map((e) => ({ ...e, project: project._id })))
        : [];

    project.name = title || project.name;
    project.version = version;
    project.baseUrl = baseUrl;
    project.status = 'parsed';
    project.endpointCount = endpointDocs.length;
    await project.save();

    return project;
  } catch (err) {
    project.status = 'failed';
    project.failureReason = err.message;
    await project.save();
    throw err;
  }
}

async function listProjects(ownerId) {
  return Project.find({ owner: ownerId }).sort({ createdAt: -1 });
}

async function getOwnedProject(projectId, ownerId) {
  const project = await Project.findOne({ _id: projectId, owner: ownerId });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return project;
}

async function deleteProject(projectId, ownerId) {
  const project = await getOwnedProject(projectId, ownerId);
  await Endpoint.deleteMany({ project: project._id });
  await project.deleteOne();
}

// Lets the user set/override the target base URL - needed for specs that
// don't declare a usable `servers`/`host` block, or to point at a
// different environment (staging vs prod) than what the spec says.
async function updateBaseUrl(projectId, ownerId, baseUrl) {
  const project = await getOwnedProject(projectId, ownerId);
  project.baseUrl = baseUrl;
  await project.save();
  return project;
}

module.exports = {
  uploadSpecFile,
  uploadSpecUrl,
  listProjects,
  getOwnedProject,
  deleteProject,
  updateBaseUrl,
};
