import { Request, Response } from "express";
import {
  addMember,
  getMembersService,
  updateMember,
} from "./workspaceMember.service";
import {
  addMemberSchema,
  updateMemberSchema,
} from "./workspaceMember.validation";

export const add = async (req: Request, res: Response) => {
  try {
    const body = addMemberSchema.parse(req.body);

    if (!req.user?.id || !req.workspace) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!req.user?.id || !req.workspace || req.workspace.level === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
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
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id || !req.workspace || req.workspace.level === undefined) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
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
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getMembers = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id || !req.workspace || req.workspace.level === undefined) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
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
    return res.status(400).json({ success: false, message: err.message });
  }
};
