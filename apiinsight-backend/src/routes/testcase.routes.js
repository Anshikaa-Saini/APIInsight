const express = require('express');
const authGuard = require('../middleware/authGuard');
const executionController = require('../controllers/execution.controller');

const router = express.Router();

router.use(authGuard);

router.post('/:testCaseId/execute', executionController.runTestCase);

module.exports = router;
