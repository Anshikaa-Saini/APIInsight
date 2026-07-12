const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema(
  {
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
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['positive', 'negative', 'edge', 'security'],
      required: true,
    },
    requestPayload: {
      // Shape: { headers?, query?, pathParams?, body? } - kept as Mixed since
      // it varies per endpoint (some have no body, some have no params, etc).
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    expectedStatusCode: {
      type: Number,
      required: true,
    },
    expectedBehaviour: {
      type: String,
      default: '',
    },
    generatedBy: {
      type: String,
      enum: ['ai', 'manual'],
      default: 'ai',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestCase', testCaseSchema);
