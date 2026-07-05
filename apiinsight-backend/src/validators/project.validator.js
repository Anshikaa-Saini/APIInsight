const { z } = require('zod');

const uploadUrlSchema = z.object({
  url: z.string().trim().url('Must be a valid URL'),
});

module.exports = { uploadUrlSchema };
