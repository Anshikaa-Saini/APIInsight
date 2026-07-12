const express = require('express');
const authGuard = require('../middleware/authGuard');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const endpointController = require('../controllers/endpoint.controller');
const testCaseController = require('../controllers/testcase.controller');
const executionController = require('../controllers/execution.controller');

const router = express.Router();

router.use(authGuard);

router.get('/:endpointId', endpointController.getEndpoint);
router.post(
  '/:endpointId/generate-testcases',
  aiRateLimiter,
  testCaseController.generateForEndpoint
);
router.get('/:endpointId/testcases', testCaseController.listForEndpoint);
router.post('/:endpointId/execute', executionController.runEndpoint);
router.get('/:endpointId/executions', executionController.listForEndpoint);

module.exports = router;
