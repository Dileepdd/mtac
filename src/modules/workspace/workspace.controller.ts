import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../errors/appError.js";
import { createWorkspace, getWorkspace, getAllWorkspaces, deleteWorkspace } from "./workspace.service.js";
import { createWorkspaceSchema } from "./workspace.validation.js";

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

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const result = await getAllWorkspaces(req.user.id, page, limit);
    return res.status(200).json({ success: true, message: "Workspaces fetched successfully", data: result.workspaces, pagination: result.pagination });
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
