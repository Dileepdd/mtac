import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../errors/appError.js";
import { createWorkspace, getWorkspace, getAllWorkspaces, updateWorkspace, deleteWorkspace, getWorkspaceStats } from "./workspace.service.js";
import { createWorkspaceSchema, updateWorkspaceSchema } from "./workspace.validation.js";
import { getActivity } from "../activity/activity.service.js";
import { TaskModel } from "../task/task.model.js";

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    const { name } = createWorkspaceSchema.parse(req.body);
    const workspace = await createWorkspace(req.user.id, name);
    return res.status(201).json({ success: true, message: "Workspace created successfully", data: workspace });
  } catch (err: any) {
    if (err instanceof ZodError) return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    return next(err);
  }
};

export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspace = await getWorkspace(req.workspace!.id);
    return res.status(200).json({ success: true, message: "Workspace fetched successfully", data: workspace });
  } catch (err) {
    return next(err);
  }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    const page  = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const result = await getAllWorkspaces(req.user.id, page, limit);
    return res.status(200).json({ success: true, message: "Workspaces fetched successfully", data: result.workspaces, pagination: result.pagination });
  } catch (err) {
    return next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id || !req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    const body = updateWorkspaceSchema.parse(req.body);
    const workspace = await updateWorkspace(req.workspace.id, req.user.id, body);
    return res.status(200).json({ success: true, message: "Workspace updated successfully", data: workspace });
  } catch (err: any) {
    if (err instanceof ZodError) return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    return next(err);
  }
};

export const stats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    const data = await getWorkspaceStats(req.workspace.id);
    return res.status(200).json({ success: true, message: "Stats fetched successfully", data });
  } catch (err) {
    return next(err);
  }
};

export const activity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    const limit = Math.min(50, parseInt(req.query.limit as string) || 30);
    const data  = await getActivity(req.workspace.id, limit);
    return res.status(200).json({ success: true, message: "Activity fetched successfully", data });
  } catch (err) {
    return next(err);
  }
};

export const myTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id || !req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    const status = req.query.status as string | undefined;
    const filter: Record<string, any> = {
      workspace_id: req.workspace.id,
      assigned_to:  req.user.id,
    };
    if (status) {
      const statuses = status.split(",").map((s) => s.trim());
      filter.status = { $in: statuses };
    }

    const tasks = await TaskModel
      .find(filter)
      .select("key title status priority labels due project_id workspace_id created_at updated_at")
      .populate<{ assigned_to: { _id: string; name: string } }>({ path: "assigned_to", select: "name" })
      .sort({ updated_at: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({ success: true, message: "Tasks fetched successfully", data: tasks });
  } catch (err) {
    return next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    await deleteWorkspace(req.workspace!.id, req.user.id);
    return res.status(200).json({ success: true, message: "Workspace deleted successfully" });
  } catch (err) {
    return next(err);
  }
};
