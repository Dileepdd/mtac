import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/appError.js";

export const checkPermission = (permissionName: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { roleId, permissions } = req.workspace ?? {};

    if (!roleId) {
      return next(new AppError("No role assigned", 403, "FORBIDDEN"));
    }

    if (!permissions?.includes(permissionName)) {
      return next(new AppError("Permission denied", 403, "FORBIDDEN"));
    }

    next();
  };
};
