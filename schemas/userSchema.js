const { z } = require('zod');

const RoleEnum = z.enum(['user', 'admin']);

exports.createUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: RoleEnum.default('user'),
});

exports.loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

exports.updateUserSchema = z.object({
  username: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: RoleEnum.optional(),
});