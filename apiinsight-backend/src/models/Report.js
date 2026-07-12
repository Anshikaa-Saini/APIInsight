const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    totalEndpoints: {
      type: Number,
      required: true,
    },
    totalTestCases: {
      type: Number,
      required: true,
    },
    passedCount: {
      type: Number,
      required: true,
    },
    failedCount: {
      type: Number,
      required: true,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true,
    },
    aiSummary: {
      type: String,
      required: true,
    },
    suggestions: {
      type: [String],
      default: [],
    },
  },
  {
    // Renames the automatic "createdAt" to "generatedAt" to match the
    // domain language used in the design doc and API responses.
    timestamps: { createdAt: 'generatedAt', updatedAt: false },
  }
);

module.exports = mongoose.model('Report', reportSchema);
