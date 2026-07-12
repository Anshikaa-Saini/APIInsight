const express = require('express');
const authGuard = require('../middleware/authGuard');
const upload = require('../middleware/uploadMiddleware');
const validateRequest = require('../middleware/validateRequest');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const { uploadUrlSchema, updateBaseUrlSchema } = require('../validators/project.validator');
const projectController = require('../controllers/project.controller');
const endpointController = require('../controllers/endpoint.controller');
const testCaseController = require('../controllers/testcase.controller');
const executionController = require('../controllers/execution.controller');
const reportController = require('../controllers/report.controller');

const router = express.Router();

// Every project route requires a logged-in user.
router.use(authGuard);

router.post('/upload-file', upload.single('specFile'), projectController.uploadFile);
router.post('/upload-url', validateRequest(uploadUrlSchema), projectController.uploadUrl);
router.get('/', projectController.listProjects);
router.get('/:projectId', projectController.getProject);
router.delete('/:projectId', projectController.deleteProject);
router.patch(
  '/:projectId/base-url',
  validateRequest(updateBaseUrlSchema),
  projectController.updateBaseUrl
);
router.get('/:projectId/endpoints', endpointController.listEndpoints);
router.post(
  '/:projectId/generate-testcases',
  aiRateLimiter,
  testCaseController.generateForProject
);
router.post('/:projectId/execute', executionController.runProject);
router.get('/:projectId/executions', executionController.listForProject);
router.post('/:projectId/generate-report', aiRateLimiter, reportController.generateReport);
router.get('/:projectId/report', reportController.getLatestReport);
router.get('/:projectId/reports/history', reportController.getReportHistory);

module.exports = router;
