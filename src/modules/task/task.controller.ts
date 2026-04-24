import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../errors/appError.js";
import { createTask, getTasks, getTask, updateTask, deleteTask, assignTask } from "./task.service.js";
import { createTaskSchema, updateTaskSchema, assignTaskSchema } from "./task.validation.js";

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id || !req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    const body = createTaskSchema.parse(req.body);
    const task = await createTask({
      title:       body.title,
      description: body.description,
      status:      body.status,
      projectId:   req.params.project_id as string,
      workspaceId: req.workspace.id,
      assignedTo:  body.assigned_to,
      priority:    body.priority,
      labels:      body.labels,
      due:         body.due,
      userId:      req.user.id,
    });

    return res.status(201).json({ success: true, message: "Task created successfully", data: task });
  } catch (err: any) {
    if (err instanceof ZodError) return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    return next(err);
  }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const result = await getTasks({ projectId: req.params.project_id as string, workspaceId: req.workspace.id, page, limit });
    return res.status(200).json({ success: true, message: "Tasks fetched successfully", data: result.tasks, pagination: result.pagination });
  } catch (err) {
    return next(err);
  }
};

export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    const task = await getTask({ taskId: req.params.task_id as string, projectId: req.params.project_id as string, workspaceId: req.workspace.id });
    return res.status(200).json({ success: true, message: "Task fetched successfully", data: task });
  } catch (err) {
    return next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id || !req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    const body = updateTaskSchema.parse(req.body);
    const task = await updateTask({
      taskId: req.params.task_id as string,
      projectId: req.params.project_id as string,
      workspaceId: req.workspace.id,
      userId: req.user.id,
      updates: body,
    });

    return res.status(200).json({ success: true, message: "Task updated successfully", data: task });
  } catch (err: any) {
    if (err instanceof ZodError) return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    return next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id || !req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    await deleteTask({ taskId: req.params.task_id as string, projectId: req.params.project_id as string, workspaceId: req.workspace.id, userId: req.user.id });
    return res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    return next(err);
  }
};

export const assign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id || !req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    const body = assignTaskSchema.parse(req.body);
    const task = await assignTask({
      taskId: req.params.task_id as string,
      projectId: req.params.project_id as string,
      workspaceId: req.workspace.id,
      assignedTo: body.assigned_to,
      userId: req.user.id,
    });

    return res.status(200).json({ success: true, message: "Task assigned successfully", data: task });
  } catch (err: any) {
    if (err instanceof ZodError) return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    return next(err);
  }
};
