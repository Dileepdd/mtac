import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../errors/appError.js";
import { getRoles, updateRolePermissions } from "./role.service.js";
import { updateRolePermissionsSchema } from "./role.validation.js";

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    const roles = await getRoles(req.workspace.id);
    return res.status(200).json({ success: true, message: "Roles fetched successfully", data: roles });
  } catch (err) {
    return next(err);
  }
};

export const updatePermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id || !req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    const { permissions } = updateRolePermissionsSchema.parse(req.body);
    const role = await updateRolePermissions({
      roleId: req.params.role_id as string,
      workspaceId: req.workspace.id,
      permissionNames: permissions,
      userId: req.user.id,
    });

    return res.status(200).json({ success: true, message: "Role permissions updated successfully", data: role });
  } catch (err: any) {
    if (err instanceof ZodError) return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    return next(err);
  }
};
