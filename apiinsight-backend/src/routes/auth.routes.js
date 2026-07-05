const express = require('express');
const authController = require('../controllers/auth.controller');
const authGuard = require('../middleware/authGuard');
const validateRequest = require('../middleware/validateRequest');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.get('/me', authGuard, authController.getMe);

module.exports = router;
