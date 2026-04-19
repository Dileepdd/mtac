import { WorkspaceMemberModel } from "./workspaceMember.model.js";
import { RoleModel } from "../role/role.model.js";
import { UserModel } from "../user/user.model.js";

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
  const [user, existingMember, role] = await Promise.all([
    UserModel.findById(userId).select("_id").lean(),

    WorkspaceMemberModel.findOne({
      user_id: userId,
      workspace_id: workspaceId,
    })
      .select("_id")
      .lean(),

    roleId
      ? RoleModel.findOne({
          _id: roleId,
          workspace_id: workspaceId,
        })
          .select("_id level")
          .lean()
      : RoleModel.findOne({
          name: "member",
          workspace_id: workspaceId,
        })
          .select("_id level")
          .lean(),
  ]);

  if (!user) {
    throw new Error("User not found");
  }

  if (existingMember) {
    throw new Error("User already exists");
  }

  if (!role) {
    throw new Error("Invalid role provided");
  }

  if (role.level <= currentUserLevel) {
    throw new Error("You cannot assign this role");
  }

  let member;
  try {
    member = await WorkspaceMemberModel.create({
      user_id: userId,
      workspace_id: workspaceId,
      role_id: role._id,
      created_by: currentUserId,
      updated_by: currentUserId,
    });
  } catch (err: any) {
    if (isDuplicateKeyError(err)) {
      throw new Error("User already exists");
    }
    throw err;
  }

  return member;
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
      .populate<{
        role_id: { level: number };
      }>({ path: "role_id", select: "level" })
      .lean(),

    RoleModel.findOne({ _id: roleId, workspace_id: workspaceId })
      .select("_id level")
      .lean(),
  ]);

  if (!member) throw new Error("Member not found");
  if (!role) throw new Error("Invalid role provided");

  if (member.role_id.level <= currentUserLevel) {
    throw new Error("You cannot update this member");
  }

  if (role.level <= currentUserLevel) {
    throw new Error("You cannot assign this role");
  }

  return WorkspaceMemberModel.findOneAndUpdate(
    { user_id: userId, workspace_id: workspaceId },
    { role_id: role._id, updated_by: currentUserId },
    { new: true }
  ).lean();
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

  // Get subordinate role IDs (roles with higher level number = lower rank)
  const subordinateRoles = await RoleModel.find({
    workspace_id: workspaceId,
    level: { $gt: currentUserLevel },
  })
    .select("_id")
    .lean();

  const subordinateRoleIds = subordinateRoles.map((r) => r._id);

  // Fetch self separately (lightweight)
  const self = await WorkspaceMemberModel.findOne({
    workspace_id: workspaceId,
    user_id: currentUserId,
  })
    .select("user_id role_id created_at")
    .populate<{ user_id: { _id: string; name: string; email: string } }>({
      path: "user_id",
      select: "name email",
    })
    .populate<{ role_id: { _id: string; name: string; level: number } }>({
      path: "role_id",
      select: "name level",
    })
    .lean();

  // Count + paginate subordinates at DB level
  const [total, members] = await Promise.all([
    WorkspaceMemberModel.countDocuments({
      workspace_id: workspaceId,
      role_id: { $in: subordinateRoleIds },
    }),
    WorkspaceMemberModel.find({
      workspace_id: workspaceId,
      role_id: { $in: subordinateRoleIds },
    })
      .select("user_id role_id created_at")
      .populate<{ user_id: { _id: string; name: string; email: string } }>({
        path: "user_id",
        select: "name email",
      })
      .populate<{ role_id: { _id: string; name: string; level: number } }>({
        path: "role_id",
        select: "name level",
      })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    self,
    members,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const isDuplicateKeyError = (err: any) => err?.code === 11000;
