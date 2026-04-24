import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name cannot exceed 50 characters"),
});

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordField,
});

export const updatePrefsSchema = z.object({
  assigned: z.boolean().optional(),
  mentions: z.boolean().optional(),
  comments: z.boolean().optional(),
  status:   z.boolean().optional(),
  weekly:   z.boolean().optional(),
});

export const updateAvatarSchema = z.object({
  avatar: z
    .string()
    .regex(/^data:image\/(jpeg|png|gif|webp);base64,/, "Must be a base64 image data URL")
    .max(700_000, "Avatar must be under 500 KB"),
});

export const createTokenSchema = z.object({
  name: z.string().trim().min(1, "Token name is required").max(60, "Token name is too long"),
});
