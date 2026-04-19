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

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const membership = await WorkspaceMemberModel.findOne({
      user_id: userId,
      workspace_id: workspaceId,
    })
      .select("role_id")
      .populate<{
        role_id: {
          _id: string;
          level: number;
          permissions: { name: string }[];
        };
      }>({
        path: "role_id",
        select: "level permissions",
        populate: { path: "permissions", select: "name" },
      })
      .lean();

    if (!membership) {
      return res
        .status(403)
        .json({ message: "Access denied: Not a workspace member" });
    }

    const role = membership.role_id;

    req.workspace = {
      id: workspaceId,
      roleId: role._id.toString(),
      level: role.level,
      permissions: role.permissions.map((p) => p.name),
    };

    next();
  } catch (err) {
    console.error("WORKSPACE MIDDLEWARE ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
