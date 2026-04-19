import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../errors/appError.js";
import {
  addMember,
  getMembersService,
  updateMember,
} from "./workspaceMember.service.js";
import {
  addMemberSchema,
  updateMemberSchema,
} from "./workspaceMember.validation.js";

export const add = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = addMemberSchema.parse(req.body);

    if (!req.user?.id || !req.workspace || req.workspace.level === undefined) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    const { userId, roleId } = body;

    const member = await addMember({
      userId,
      roleId,
      workspaceId: req.workspace.id,
      currentUserId: req.user.id,
      currentUserLevel: req.workspace.level,
    });

    return res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: member,
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    }
    return next(mapWorkspaceMemberError(err));
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    return res.status(200).json({
      success: true,
      message: "Member updated successfully",
      data: member,
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    }
    return next(mapWorkspaceMemberError(err));
  }
};

export const getMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id || !req.workspace || req.workspace.level === undefined) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 20)
    );

    const members = await getMembersService({
      workspaceId: req.workspace.id,
      currentUserLevel: req.workspace.level,
      currentUserId: req.user.id,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Members fetched successfully",
      data: members,
    });
  } catch (err: any) {
    return next(mapWorkspaceMemberError(err));
  }
};

const mapWorkspaceMemberError = (err: any) => {
  const message = err?.message || "Workspace member operation failed";
  const normalized = message.toLowerCase();

  if (normalized.includes("not found")) {
    return new AppError(message, 404, "NOT_FOUND");
  }
  if (normalized.includes("already exists")) {
    return new AppError(message, 409, "ALREADY_EXISTS");
  }
  if (normalized.includes("cannot")) {
    return new AppError(message, 403, "FORBIDDEN");
  }
  if (normalized.includes("invalid")) {
    return new AppError(message, 400, "BAD_REQUEST");
  }
  return new AppError(message, 500, "WORKSPACE_MEMBER_FAILED");
};
