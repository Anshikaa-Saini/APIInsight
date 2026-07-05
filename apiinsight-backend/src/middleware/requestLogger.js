const morgan = require('morgan');
const { nodeEnv } = require('../config/env');

// Concise logs in production, more verbose (dev) logs locally.
const requestLogger = morgan(nodeEnv === 'production' ? 'combined' : 'dev');

module.exports = requestLogger;
