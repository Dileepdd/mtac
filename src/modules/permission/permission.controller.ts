import { NextFunction, Request, Response } from "express";
import { PermissionModel } from "./permission.model.js";

export const listPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const perms = await PermissionModel.find().select("name").sort({ name: 1 }).lean();
    return res.status(200).json({ success: true, data: perms });
  } catch (err) {
    return next(err);
  }
};
