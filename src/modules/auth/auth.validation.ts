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

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  newPassword: passwordField,
});

export const verifyEmailSchema = z.object({
  email: emailField,
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be numeric"),
});

export const resendOtpSchema = z.object({
  email: emailField,
});

export type RegisterDTO = z.infer<typeof registerSchema>;
export type LogInDTO = z.infer<typeof logInSchema>;
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;
