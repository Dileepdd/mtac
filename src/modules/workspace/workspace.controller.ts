import { Request, Response } from "express";
import { createWorkspace, getWorkspace } from "./workspace.service.js";
import { createWorkspaceSchema } from "./workspace.validation.js";

export const create = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const body = createWorkspaceSchema.parse(req.body);
    const { name } = body;

    const workspace = await createWorkspace(req.user.id, name);

    return res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      data: workspace,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
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
