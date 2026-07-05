const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sourceType: {
      type: String,
      enum: ['json', 'yaml', 'url'],
      required: true,
    },
    sourceUrl: {
      type: String, // only set when sourceType === 'url'
    },
    version: {
      type: String,
    },
    status: {
      type: String,
      enum: ['processing', 'parsed', 'failed'],
      default: 'processing',
    },
    endpointCount: {
      type: Number,
      default: 0,
    },
    failureReason: {
      type: String, // populated when status === 'failed', shown to the user
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
