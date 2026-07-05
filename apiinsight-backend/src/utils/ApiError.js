// A single error shape used across the whole app so the errorHandler
// middleware can turn any thrown error into a consistent JSON response.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes expected errors from bugs
  }
}

module.exports = ApiError;
