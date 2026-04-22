import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../errors/appError.js";
import { getUserProfile, updateUserProfile, changePassword } from "./user.service.js";
import { updateProfileSchema, changePasswordSchema } from "./user.validation.js";

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    const user = await getUserProfile(req.user.id);
    return res.status(200).json({ success: true, message: "Profile fetched successfully", data: user });
  } catch (err) {
    return next(err);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    const { name } = updateProfileSchema.parse(req.body);
    const user = await updateUserProfile(req.user.id, name);

    return res.status(200).json({ success: true, message: "Profile updated successfully", data: user });
  } catch (err: any) {
    if (err instanceof ZodError) return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    return next(err);
  }
};

export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await changePassword(req.user.id, currentPassword, newPassword);

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (err: any) {
    if (err instanceof ZodError) return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    return next(err);
  }
};
