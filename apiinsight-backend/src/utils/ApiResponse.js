// Small helper so every successful response has the same envelope:
// { success, data, message }
function sendSuccess(res, statusCode, data, message = 'Success') {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

module.exports = { sendSuccess };
