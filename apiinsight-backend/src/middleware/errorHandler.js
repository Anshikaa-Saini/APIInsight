const ApiError = require('../utils/ApiError');

// Must be registered LAST in app.js (after all routes) — Express
// identifies error-handling middleware by its 4-argument signature.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose duplicate key error (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field} already in use`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  if (!(err instanceof ApiError) && statusCode === 500) {
    // eslint-disable-next-line no-console
    console.error(err); // log unexpected/programmer errors for debugging
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = errorHandler;
