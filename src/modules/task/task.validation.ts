import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  assigned_to: z.string().optional(),
  priority: z.enum(["urgent", "high", "med", "low", "none"]).optional(),
  labels: z.array(z.string().trim().max(30)).max(10).optional(),
  due: z.string().datetime({ offset: true }).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["urgent", "high", "med", "low", "none"]).optional(),
  labels: z.array(z.string().trim().max(30)).max(10).optional(),
  due: z.string().datetime({ offset: true }).nullable().optional(),
});

export const assignTaskSchema = z.object({
  assigned_to: z.string().min(1, "assigned_to is required"),
});
