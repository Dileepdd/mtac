import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  description: z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional(),
  assigned_to: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
});

export const assignTaskSchema = z.object({
  assigned_to: z.string().min(1, "assigned_to is required"),
});
