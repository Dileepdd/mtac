import { z } from "zod";

export const createProjectSchema = z.object({
  name:  z.string().trim().min(1, "Name is required").max(100),
  key:   z.string().trim().min(1).max(6).regex(/^[A-Z0-9]+$/, "Key must be uppercase letters/numbers").optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").optional(),
});

export const updateProjectSchema = z.object({
  name:  z.string().trim().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").optional(),
});
