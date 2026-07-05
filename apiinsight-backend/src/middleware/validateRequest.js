const ApiError = require('../utils/ApiError');

// Takes a Zod schema and validates req.body against it.
// Usage: router.post('/route', validateRequest(schema), controller)
const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new ApiError(400, message);
  }

  // Use the parsed (and potentially trimmed/coerced) data going forward.
  req.body = result.data;
  next();
};

module.exports = validateRequest;
