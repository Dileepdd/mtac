import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../errors/appError.js";
import { createProject, getProjects, getProject, updateProject, deleteProject } from "./project.service.js";
import { createProjectSchema, updateProjectSchema } from "./project.validation.js";

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id || !req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    const { name } = createProjectSchema.parse(req.body);
    const project = await createProject({ name, workspaceId: req.workspace.id, userId: req.user.id });

    return res.status(201).json({ success: true, message: "Project created successfully", data: project });
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

    const result = await getProjects({ workspaceId: req.workspace.id, page, limit });
    return res.status(200).json({ success: true, message: "Projects fetched successfully", data: result.projects, pagination: result.pagination });
  } catch (err) {
    return next(err);
  }
};

export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    const project = await getProject({ projectId: req.params.project_id as string, workspaceId: req.workspace.id });
    return res.status(200).json({ success: true, message: "Project fetched successfully", data: project });
  } catch (err) {
    return next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    const { name } = updateProjectSchema.parse(req.body);
    const project = await updateProject({ projectId: req.params.project_id as string, workspaceId: req.workspace.id, name });

    return res.status(200).json({ success: true, message: "Project updated successfully", data: project });
  } catch (err: any) {
    if (err instanceof ZodError) return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    return next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id || !req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    await deleteProject({ projectId: req.params.project_id as string, workspaceId: req.workspace.id, userId: req.user.id });
    return res.status(200).json({ success: true, message: "Project deleted successfully" });
  } catch (err) {
    return next(err);
  }
};
