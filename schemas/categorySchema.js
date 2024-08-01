const { z } = require('zod');


exports.createCategorySchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    });

exports.updateCategorySchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    });
