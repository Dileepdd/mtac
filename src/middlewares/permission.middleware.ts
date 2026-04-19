import { Request, Response, NextFunction } from "express";
import { RoleModel } from "../modules/role/role.model.js";

export const checkPermission = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleId, permissions } = req.workspace ?? {};

      if (!roleId) {
        return res.status(403).json({ message: "No role assigned" });
      }

      if (permissions) {
        if (!permissions.includes(permissionName)) {
          return res.status(403).json({ message: "Permission denied" });
        }
        return next();
      }

      const role = await RoleModel.findById(roleId)
        .select("permissions level")
        .populate<{
          permissions: { name: string }[];
        }>({ path: "permissions", select: "name" })
        .lean();

      if (!role) {
        return res.status(403).json({ message: "Role not found" });
      }

      if (!role.permissions.some((p) => p.name === permissionName)) {
        return res.status(403).json({ message: "Permission denied" });
      }

      req.workspace!.level = role.level;

      next();
    } catch (err) {
      console.error("PERMISSION MIDDLEWARE ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};
