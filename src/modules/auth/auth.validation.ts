import { z } from "zod";

const emailField = z.email().trim().toLowerCase();

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

export const registerSchema = z.object({
  name: z.string().trim().min(3),
  email: emailField,
  password: passwordField,
});

export const logInSchema = z.object({
  email: emailField,
  password: z.string().min(1),
});

export type RegisterDTO = z.infer<typeof registerSchema>;
export type LogInDTO = z.infer<typeof logInSchema>;
