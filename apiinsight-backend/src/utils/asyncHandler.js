// Wraps an async controller/middleware so any rejected promise is
// forwarded to Express's error handling via next(err), instead of
// needing a try/catch block in every single controller.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
