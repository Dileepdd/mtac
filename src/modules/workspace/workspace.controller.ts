import { NextFunction, Request, Response } from "express";
import {
  createWorkspace,
  getWorkspace,
  getAllWorkspaces,
} from "./workspace.service.js";
import { createWorkspaceSchema } from "./workspace.validation.js";
import { ZodError } from "zod";
import { AppError } from "../../errors/appError.js";

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    const { name } = createWorkspaceSchema.parse(req.body);

    const workspace = await createWorkspace(req.user.id, name);

    return res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      data: workspace,
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    }
    if (err?.message === "workspace with this name already exists") {
      return next(new AppError(err.message, 409, "WORKSPACE_EXISTS"));
    }
    if (err?.message === "Permissions not seeded") {
      return next(new AppError("Server configuration error", 500, "PERMISSIONS_NOT_SEEDED"));
    }
    return next(new AppError("Workspace creation failed", 500, "WORKSPACE_CREATE_FAILED"));
  }
};

export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspace_id = req.params.workspace_id as string;
    const workspace = await getWorkspace(workspace_id);
    return res.status(200).json({
      success: true,
      message: "workspace details fetched successfully",
      data: workspace,
    });
  } catch (err: any) {
    if (err?.message === "Workspace not found") {
      return next(new AppError(err.message, 404, "WORKSPACE_NOT_FOUND"));
    }
    if (err?.message === "Invalid workspace id") {
      return next(new AppError(err.message, 400, "INVALID_WORKSPACE_ID"));
    }
    return next(new AppError("Failed to fetch workspace", 500, "WORKSPACE_FETCH_FAILED"));
  }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    const workspaces = await getAllWorkspaces(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Workspaces fetched successfully",
      data: workspaces,
    });
  } catch (_err: any) {
    return next(new AppError("Failed to fetch workspaces", 500, "WORKSPACES_FETCH_FAILED"));
  }
};
