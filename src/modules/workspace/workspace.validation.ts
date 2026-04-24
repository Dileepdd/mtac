import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(3).max(100).regex(/^[a-zA-Z0-9\s\-_.]+$/, "Invalid characters in name"),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(3).max(100).optional(),
  settings: z.object({
    accent:      z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    font:        z.enum(["geist", "plex", "system"]).optional(),
    density:     z.enum(["compact", "comfortable", "spacious"]).optional(),
    timezone:    z.string().max(60).optional(),
    date_format: z.string().max(20).optional(),
    language:    z.string().max(10).optional(),
  }).optional(),
});
