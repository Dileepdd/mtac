import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(3),
  email: z.email(),
  password: z.string().min(6),
});

export const logInSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export type RegisterDTO = z.infer<typeof registerSchema>;
export type LogInDTO = z.infer<typeof logInSchema>;
