import { Request, Response, NextFunction } from "express";
import { RoleModel } from "../modules/role/role.model.js";

export const checkPermission = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = req.workspace?.roleId;

      if (!roleId) {
        return res.status(403).json({
          message: "No role assigned",
        });
      }

      const role = await RoleModel.findById(roleId)
        .select("permissions")
        .populate({
          path: "permissions",
          select: "name",
        })
        .lean();

      if (!role) {
        return res.status(403).json({
          message: "Role not found",
        });
      }

      const hasPermission = role.permissions.some(
        (p: any) => p.name === permissionName
      );

      if (!hasPermission) {
        return res.status(403).json({
          message: "Permission denied",
        });
      }

      next();
    } catch (err) {
      console.error("PERMISSION MIDDLEWARE ERROR:", err);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  };
};
