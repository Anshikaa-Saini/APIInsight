const mongoose = require('mongoose');

// Sub-schema for a single parameter (query/path/header param from the spec).
// { _id: false } because these only ever live nested inside an Endpoint.
const parameterSchema = new mongoose.Schema(
  {
    name: String,
    in: String, // "query" | "path" | "header" | "cookie"
    required: Boolean,
    schema: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const endpointSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    path: {
      type: String,
      required: true, // e.g. "/users/{id}"
    },
    method: {
      type: String,
      required: true, // "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | ...
    },
    summary: {
      type: String,
      default: '',
    },
    parameters: {
      type: [parameterSchema],
      default: [],
    },
    requestBodySchema: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    responses: {
      type: mongoose.Schema.Types.Mixed,
      default: {}, // keyed by status code, straight from the spec
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Endpoint', endpointSchema);
