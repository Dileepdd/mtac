import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../errors/appError.js";
import { addMember, getMembersService, updateMember, removeMember } from "./workspaceMember.service.js";
import { addMemberSchema, updateMemberSchema, removeMemberSchema } from "./workspaceMember.validation.js";

export const add = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id || !req.workspace || req.workspace.level === undefined) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    const { userId, roleId } = addMemberSchema.parse(req.body);

    const member = await addMember({
      userId,
      roleId,
      workspaceId: req.workspace.id,
      currentUserId: req.user.id,
      currentUserLevel: req.workspace.level,
    });

    return res.status(201).json({ success: true, message: "Member added successfully", data: member });
  } catch (err: any) {
    if (err instanceof ZodError) return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    return next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id || !req.workspace || req.workspace.level === undefined) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    const body = updateMemberSchema.parse(req.body);

    const member = await updateMember({
      userId: body.userId,
      roleId: body.roleId,
      workspaceId: req.workspace.id,
      currentUserId: req.user.id,
      currentUserLevel: req.workspace.level,
    });

    return res.status(200).json({ success: true, message: "Member updated successfully", data: member });
  } catch (err: any) {
    if (err instanceof ZodError) return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    return next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id || !req.workspace || req.workspace.level === undefined) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    const { userId } = removeMemberSchema.parse(req.body);

    await removeMember({
      userId,
      workspaceId: req.workspace.id,
      currentUserId: req.user.id,
      currentUserLevel: req.workspace.level,
    });

    return res.status(200).json({ success: true, message: "Member removed successfully" });
  } catch (err: any) {
    if (err instanceof ZodError) return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    return next(err);
  }
};

export const getMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id || !req.workspace || req.workspace.level === undefined) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const members = await getMembersService({
      workspaceId: req.workspace.id,
      currentUserLevel: req.workspace.level,
      currentUserId: req.user.id,
      page,
      limit,
    });

    return res.status(200).json({ success: true, message: "Members fetched successfully", data: members });
  } catch (err) {
    return next(err);
  }
};
