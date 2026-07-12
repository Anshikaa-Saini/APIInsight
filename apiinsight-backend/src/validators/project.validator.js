const { z } = require('zod');

const uploadUrlSchema = z.object({
  url: z.string().trim().url('Must be a valid URL'),
});

const updateBaseUrlSchema = z.object({
  baseUrl: z.string().trim().url('Must be a valid URL'),
});

module.exports = { uploadUrlSchema, updateBaseUrlSchema };
