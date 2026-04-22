import { WorkspaceMemberModel } from "./workspaceMember.model.js";
import { RoleModel } from "../role/role.model.js";
import { UserModel } from "../user/user.model.js";
import { AppError } from "../../errors/appError.js";
import { logger } from "../../utils/logger.js";

export const addMember = async ({
  userId,
  roleId,
  workspaceId,
  currentUserId,
  currentUserLevel,
}: {
  userId: string;
  roleId?: string;
  workspaceId: string;
  currentUserId: string;
  currentUserLevel: number;
}) => {
  const [user, role] = await Promise.all([
    UserModel.findById(userId).select("_id").lean(),
    roleId
      ? RoleModel.findOne({ _id: roleId, workspace_id: workspaceId }).select("_id level").lean()
      : RoleModel.findOne({ name: "member", workspace_id: workspaceId }).select("_id level").lean(),
  ]);

  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  if (!role) throw new AppError("Invalid role provided", 400, "INVALID_ROLE");

  if (role.level <= currentUserLevel) {
    throw new AppError("You cannot assign this role", 403, "FORBIDDEN");
  }

  try {
    const member = await WorkspaceMemberModel.create({
      user_id: userId,
      workspace_id: workspaceId,
      role_id: role._id,
      created_by: currentUserId,
      updated_by: currentUserId,
    });
    logger.info("member.added", { userId, workspaceId, roleId: role._id, addedBy: currentUserId });
    return member;
  } catch (err: any) {
    if (err?.code === 11000) throw new AppError("User already a member", 409, "ALREADY_EXISTS");
    throw err;
  }
};

export const updateMember = async ({
  userId,
  roleId,
  workspaceId,
  currentUserId,
  currentUserLevel,
}: {
  userId: string;
  roleId: string;
  workspaceId: string;
  currentUserId: string;
  currentUserLevel: number;
}) => {
  const [member, role] = await Promise.all([
    WorkspaceMemberModel.findOne({ user_id: userId, workspace_id: workspaceId })
      .select("_id role_id")
      .populate<{ role_id: { level: number } }>({ path: "role_id", select: "level" })
      .lean(),
    RoleModel.findOne({ _id: roleId, workspace_id: workspaceId }).select("_id level").lean(),
  ]);

  if (!member) throw new AppError("Member not found", 404, "NOT_FOUND");
  if (!role) throw new AppError("Invalid role provided", 400, "INVALID_ROLE");

  if (member.role_id.level <= currentUserLevel) {
    throw new AppError("You cannot update this member", 403, "FORBIDDEN");
  }
  if (role.level <= currentUserLevel) {
    throw new AppError("You cannot assign this role", 403, "FORBIDDEN");
  }

  const updated = await WorkspaceMemberModel.findOneAndUpdate(
    { user_id: userId, workspace_id: workspaceId },
    { role_id: role._id, updated_by: currentUserId },
    { returnDocument: "after" }
  ).lean();

  logger.info("member.role_updated", { userId, workspaceId, newRoleId: role._id, updatedBy: currentUserId });
  return updated;
};

export const removeMember = async ({
  userId,
  workspaceId,
  currentUserId,
  currentUserLevel,
}: {
  userId: string;
  workspaceId: string;
  currentUserId: string;
  currentUserLevel: number;
}) => {
  if (userId === currentUserId) {
    throw new AppError("You cannot remove yourself", 400, "BAD_REQUEST");
  }

  const member = await WorkspaceMemberModel.findOne({ user_id: userId, workspace_id: workspaceId })
    .select("_id role_id")
    .populate<{ role_id: { level: number } }>({ path: "role_id", select: "level" })
    .lean();

  if (!member) throw new AppError("Member not found", 404, "NOT_FOUND");

  if (member.role_id.level <= currentUserLevel) {
    throw new AppError("You cannot remove this member", 403, "FORBIDDEN");
  }

  await WorkspaceMemberModel.findByIdAndDelete(member._id);
  logger.info("member.removed", { userId, workspaceId, removedBy: currentUserId });
};

export const getMembersService = async ({
  workspaceId,
  currentUserLevel,
  currentUserId,
  page = 1,
  limit = 20,
}: {
  workspaceId: string;
  currentUserLevel: number;
  currentUserId: string;
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;

  const subordinateRoles = await RoleModel.find({
    workspace_id: workspaceId,
    level: { $gt: currentUserLevel },
  })
    .select("_id")
    .lean();

  const subordinateRoleIds = subordinateRoles.map((r) => r._id);

  const self = await WorkspaceMemberModel.findOne({ workspace_id: workspaceId, user_id: currentUserId })
    .select("user_id role_id created_at")
    .populate<{ user_id: { _id: string; name: string; email: string } }>({ path: "user_id", select: "name email" })
    .populate<{ role_id: { _id: string; name: string; level: number } }>({ path: "role_id", select: "name level" })
    .lean();

  const [total, members] = await Promise.all([
    WorkspaceMemberModel.countDocuments({ workspace_id: workspaceId, role_id: { $in: subordinateRoleIds } }),
    WorkspaceMemberModel.find({ workspace_id: workspaceId, role_id: { $in: subordinateRoleIds } })
      .select("user_id role_id created_at")
      .populate<{ user_id: { _id: string; name: string; email: string } }>({ path: "user_id", select: "name email" })
      .populate<{ role_id: { _id: string; name: string; level: number } }>({ path: "role_id", select: "name level" })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    self,
    members,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};
