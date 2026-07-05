const SwaggerParser = require('@apidevtools/swagger-parser');
const yaml = require('js-yaml');
const ApiError = require('../utils/ApiError');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

/**
 * Parses raw file content (JSON or YAML text) into a spec object,
 * then validates + extracts endpoints from it.
 */
async function parseSpecContent(rawText, format) {
  let specObject;
  try {
    specObject = format === 'json' ? JSON.parse(rawText) : yaml.load(rawText);
  } catch (err) {
    throw new ApiError(400, `Could not parse file as ${format.toUpperCase()}: ${err.message}`);
  }

  return validateAndExtract(specObject);
}

/**
 * Fetches + validates a spec directly from a URL. Swagger Parser handles
 * the HTTP fetch and JSON/YAML detection itself.
 */
async function parseSpecFromUrl(url) {
  return validateAndExtract(url);
}

/**
 * Runs the spec through Swagger Parser's `validate()`, which does two
 * things in one pass: (1) validates it against the OpenAPI/Swagger schema,
 * and (2) dereferences all $ref pointers so nested schemas are fully
 * resolved and easy to store/read later.
 */
async function validateAndExtract(specSource) {
  let api;
  try {
    api = await SwaggerParser.validate(specSource);
  } catch (err) {
    throw new ApiError(400, `Invalid Swagger/OpenAPI spec: ${err.message}`);
  }

  return {
    title: api.info?.title,
    version: api.info?.version,
    endpoints: extractEndpoints(api),
  };
}

/**
 * Walks the dereferenced spec's `paths` object and flattens it into one
 * entry per (path, method) pair - which is the unit we store, generate
 * test cases for, and execute later.
 */
function extractEndpoints(api) {
  const endpoints = [];
  const paths = api.paths || {};

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;

      endpoints.push({
        path: pathKey,
        method: method.toUpperCase(),
        summary: operation.summary || operation.description || '',
        parameters: extractParameters(operation, pathItem),
        requestBodySchema: extractRequestBodySchema(operation),
        responses: operation.responses || {},
      });
    }
  }

  return endpoints;
}

function extractParameters(operation, pathItem) {
  // Parameters can be declared per-operation or shared at the path level.
  const params = operation.parameters || pathItem.parameters || [];

  return params
    .filter((p) => p.in !== 'body') // Swagger 2.0 body params are handled separately below
    .map((p) => ({
      name: p.name,
      in: p.in,
      required: !!p.required,
      schema: p.schema || {},
    }));
}

function extractRequestBodySchema(operation) {
  // OpenAPI 3.x style
  if (operation.requestBody) {
    return operation.requestBody.content?.['application/json']?.schema || {};
  }

  // Swagger 2.0 style: body is just another parameter with in: "body"
  const bodyParam = (operation.parameters || []).find((p) => p.in === 'body');
  return bodyParam?.schema || {};
}

module.exports = { parseSpecContent, parseSpecFromUrl };
