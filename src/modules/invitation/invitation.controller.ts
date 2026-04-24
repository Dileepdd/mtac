import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../errors/appError.js";
import { createInvitation, acceptInvitation, getInviteInfo } from "./invitation.service.js";
import { sendInviteSchema } from "./invitation.validation.js";

export const invite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id || !req.workspace || req.workspace.level === undefined) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    const { email, roleId } = sendInviteSchema.parse(req.body);

    const result = await createInvitation({
      email,
      roleId,
      workspaceId: req.workspace.id,
      invitedById: req.user.id,
      currentUserLevel: req.workspace.level,
    });

    return res.status(200).json({
      success: true,
      message: "Invitation sent successfully",
      data: result,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    }
    return next(err);
  }
};

export const inviteInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.params.token as string;
    if (!token) return next(new AppError("Token is required", 400, "MISSING_TOKEN"));
    const result = await getInviteInfo(token);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
};

export const acceptInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    const token = req.params.token as string;
    if (!token) return next(new AppError("Token is required", 400, "MISSING_TOKEN"));

    const result = await acceptInvitation({ token, userId: req.user.id });

    return res.status(200).json({
      success: true,
      message: "Invitation accepted successfully",
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};
