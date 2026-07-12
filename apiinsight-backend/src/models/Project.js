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
    baseUrl: {
      // Where test cases actually get executed against. Auto-extracted from
      // the spec's `servers` (OpenAPI 3) / `host`+`basePath` (Swagger 2)
      // fields when possible; the user can also set/override it manually,
      // since plenty of real specs don't declare a usable one at all.
      type: String,
      default: null,
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
