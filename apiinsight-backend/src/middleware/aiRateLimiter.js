const rateLimit = require('express-rate-limit');

// Every hit on these routes costs real money (OpenAI tokens), so they get
// a tighter limit than the rest of the API. 20 requests / 15 min / IP is
// generous for normal use but stops a runaway frontend loop or abuse from
// running up the bill unnoticed.
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI generation requests. Please try again in a few minutes.',
  },
});

module.exports = aiRateLimiter;
