import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Workspace name must be at least 3 characters")
    .max(100, "Workspace name cannot exceed 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, "Workspace name contains invalid characters"),
});
