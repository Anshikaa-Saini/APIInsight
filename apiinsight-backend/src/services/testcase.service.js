const TestCase = require('../models/TestCase');
const Endpoint = require('../models/Endpoint');
const ApiError = require('../utils/ApiError');
const aiTestGen = require('./aiTestGen.service');
const projectService = require('./project.service');

// Shared by both single-endpoint and bulk generation: calls the AI, then
// replaces any previously AI-generated test cases for this endpoint so
// re-generating doesn't just keep piling up duplicates.
async function generateAndSave(endpoint) {
  const generated = await aiTestGen.generateTestCasesForEndpoint(endpoint);

  await TestCase.deleteMany({ endpoint: endpoint._id, generatedBy: 'ai' });

  return TestCase.insertMany(
    generated.map((testCase) => ({
      ...testCase,
      endpoint: endpoint._id,
      project: endpoint.project,
      generatedBy: 'ai',
    }))
  );
}

async function generateForEndpoint(ownerId, endpointId) {
  const endpoint = await Endpoint.findById(endpointId);
  if (!endpoint) {
    throw new ApiError(404, 'Endpoint not found');
  }
  await projectService.getOwnedProject(endpoint.project, ownerId); // ownership check

  return generateAndSave(endpoint);
}

// Generates test cases for every endpoint in a project. Endpoints are
// processed one at a time (not in parallel) to stay within OpenAI rate
// limits, and a failure on one endpoint doesn't stop the others - each
// result is reported individually so the user can see exactly what
// succeeded and what needs a retry.
async function generateForProject(ownerId, projectId) {
  await projectService.getOwnedProject(projectId, ownerId);
  const endpoints = await Endpoint.find({ project: projectId });

  const results = [];
  for (const endpoint of endpoints) {
    try {
      const testCases = await generateAndSave(endpoint);
      results.push({
        endpointId: endpoint._id,
        method: endpoint.method,
        path: endpoint.path,
        status: 'success',
        count: testCases.length,
      });
    } catch (err) {
      results.push({
        endpointId: endpoint._id,
        method: endpoint.method,
        path: endpoint.path,
        status: 'failed',
        error: err.message,
      });
    }
  }

  return results;
}

async function listForEndpoint(ownerId, endpointId) {
  const endpoint = await Endpoint.findById(endpointId);
  if (!endpoint) {
    throw new ApiError(404, 'Endpoint not found');
  }
  await projectService.getOwnedProject(endpoint.project, ownerId);

  return TestCase.find({ endpoint: endpointId }).sort({ category: 1, createdAt: 1 });
}

module.exports = { generateForEndpoint, generateForProject, listForEndpoint };
