const { z } = require('zod');


exports.createProductSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    price: z.number().positive(),
    stock: z.number().positive(),
    categoryName: z.string().min(1),
    });     

exports.updateProductSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    price: z.number().positive().optional(),
    stock: z.number().positive().optional(),
    categoryName: z.string().min(1).optional(),
    });
