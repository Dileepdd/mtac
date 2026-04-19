import { Request, Response, NextFunction } from "express";

export const checkPermission = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleId, permissions, level } = req.workspace ?? {};

      if (!roleId) {
        return res.status(403).json({ message: "No role assigned" });
      }

      if (!permissions || !permissions.includes(permissionName)) {
        return res.status(403).json({ message: "Permission denied" });
      }

      next();
    } catch (err) {
      console.error("PERMISSION MIDDLEWARE ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};
