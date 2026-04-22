import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { WorkspaceMemberModel } from "../modules/workspaceMember/workspaceMember.model.js";
import { AppError } from "../errors/appError.js";

export const workspaceMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const workspaceId = req.params.workspace_id as string;

    if (!userId) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return next(new AppError("Invalid workspace id", 400, "INVALID_ID"));
    }

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
      return next(new AppError("Not a workspace member", 403, "FORBIDDEN"));
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
    next(err);
  }
};
