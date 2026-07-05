const express = require('express');
const authGuard = require('../middleware/authGuard');
const endpointController = require('../controllers/endpoint.controller');

const router = express.Router();

router.use(authGuard);

router.get('/:endpointId', endpointController.getEndpoint);

module.exports = router;
