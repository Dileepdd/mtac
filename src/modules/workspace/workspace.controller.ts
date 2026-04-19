import { Request, Response } from "express";
import {
  createWorkspace,
  getWorkspace,
  getAllWorkspaces,
} from "./workspace.service.js";
import { createWorkspaceSchema } from "./workspace.validation.js";
import { ZodError } from "zod";

export const create = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
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
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: err.issues,
      });
    }

    if (err.message === "workspace with this name already exists") {
      return res.status(409).json({
        success: false,
        message: err.message,
      });
    }

    if (err.message === "Permissions not seeded") {
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || "Something went wrong",
    });
  }
};

export const get = async (req: Request, res: Response) => {
  try {
    const workspace_id = req.params.workspace_id as string;
    if (!req.params.workspace_id) {
      return res.status(400).json({
        success: false,
        message: "Workspace ID is required",
      });
    }
    const workspace = await getWorkspace(workspace_id);
    return res.status(200).json({
      success: true,
      message: "workspace details fetched successfully",
      data: workspace,
    });
  } catch (err: any) {
    console.error("GET WORKSPACE ERROR:", err);

    const status = err.message === "Workspace not found" ? 404 : 400;

    return res.status(status).json({
      success: false,
      message: err.message,
    });
  }
};

export const getAll = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const workspaces = await getAllWorkspaces(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Workspaces fetched successfully",
      data: workspaces,
    });
  } catch (err: any) {
    console.error("GET ALL WORKSPACES ERROR:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};
