const express = require('express');
const authGuard = require('../middleware/authGuard');
const upload = require('../middleware/uploadMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { uploadUrlSchema } = require('../validators/project.validator');
const projectController = require('../controllers/project.controller');
const endpointController = require('../controllers/endpoint.controller');

const router = express.Router();

// Every project route requires a logged-in user.
router.use(authGuard);

router.post('/upload-file', upload.single('specFile'), projectController.uploadFile);
router.post('/upload-url', validateRequest(uploadUrlSchema), projectController.uploadUrl);
router.get('/', projectController.listProjects);
router.get('/:projectId', projectController.getProject);
router.delete('/:projectId', projectController.deleteProject);
router.get('/:projectId/endpoints', endpointController.listEndpoints);

module.exports = router;
