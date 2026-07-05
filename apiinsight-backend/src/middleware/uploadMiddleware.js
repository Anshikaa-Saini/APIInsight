const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

const ALLOWED_EXTENSIONS = ['.json', '.yaml', '.yml'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB is more than enough for a spec file

// Keep the file in memory (no disk writes) - we only need it long enough
// to parse it, then it's discarded once the endpoints are stored in Mongo.
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new ApiError(400, 'Only .json, .yaml, or .yml files are allowed'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

module.exports = upload;
