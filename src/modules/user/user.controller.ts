import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../errors/appError.js";
import { getUserProfile, updateUserProfile, changePassword, updatePreferences, updateAvatar, deleteAccount } from "./user.service.js";
import { updateProfileSchema, changePasswordSchema, updatePrefsSchema, updateAvatarSchema, createTokenSchema } from "./user.validation.js";
import { listTokens, createToken, revokeToken } from "./token.service.js";

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

export const updatePreferencesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    const prefs = updatePrefsSchema.parse(req.body);
    const updated = await updatePreferences(req.user.id, prefs);
    return res.status(200).json({ success: true, message: "Preferences updated", data: updated });
  } catch (err: any) {
    if (err instanceof ZodError) return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    return next(err);
  }
};

export const uploadAvatarController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    const { avatar } = updateAvatarSchema.parse(req.body);
    const user = await updateAvatar(req.user.id, avatar);
    return res.status(200).json({ success: true, message: "Avatar updated", data: user });
  } catch (err: any) {
    if (err instanceof ZodError) return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    return next(err);
  }
};

export const deleteAccountController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    await deleteAccount(req.user.id);
    return res.status(200).json({ success: true, message: "Account deleted" });
  } catch (err) {
    return next(err);
  }
};

export const listTokensController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    const tokens = await listTokens(req.user.id);
    return res.status(200).json({ success: true, data: tokens });
  } catch (err) {
    return next(err);
  }
};

export const createTokenController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    const { name } = createTokenSchema.parse(req.body);
    const result = await createToken(req.user.id, name);
    return res.status(201).json({ success: true, message: "Token created — copy it now, it won't be shown again.", data: result });
  } catch (err: any) {
    if (err instanceof ZodError) return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    return next(err);
  }
};

export const revokeTokenController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    await revokeToken(req.user.id, String(req.params.token_id));
    return res.status(200).json({ success: true, message: "Token revoked" });
  } catch (err) {
    return next(err);
  }
};
