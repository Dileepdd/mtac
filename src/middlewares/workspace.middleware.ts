import { Request, Response, NextFunction } from "express";
import { WorkspaceMemberModel } from "../modules/workspaceMember/workspaceMember.model.js";

export const workspaceMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const workspaceId = req.params.workspace_id as string;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const membership = await WorkspaceMemberModel.findOne({
      user_id: userId,
      workspace_id: workspaceId,
    })
      .select("role_id")
      .lean();

    if (!membership) {
      return res.status(403).json({
        message: "Access denied: Not a workspace member",
      });
    }

    req.workspace = {
      id: workspaceId,
      roleId: membership.role_id.toString(),
    };

    next();
  } catch (err) {
    console.error("WORKSPACE MIDDLEWARE ERROR:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
