const mongoose = require('mongoose');

const executionSchema = new mongoose.Schema(
  {
    testCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestCase',
      required: true,
      index: true,
    },
    endpoint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Endpoint',
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    // null actualStatusCode means the request itself never got a response
    // (network error, timeout, DNS failure) - see errorMessage in that case.
    actualStatusCode: {
      type: Number,
      default: null,
    },
    actualResponseBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    responseTimeMs: {
      type: Number,
      default: null,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  {
    // Renames the automatic "createdAt" to "executedAt" to match the
    // domain language used everywhere else (design doc, API responses).
    timestamps: { createdAt: 'executedAt', updatedAt: false },
  }
);

module.exports = mongoose.model('Execution', executionSchema);
