import { WorkspaceMemberModel } from "./workspaceMember.model";
import { RoleModel } from "../role/role.model";
import { UserModel } from "../user/user.model";

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

  const member = await WorkspaceMemberModel.create({
    user_id: userId,
    workspace_id: workspaceId,
    role_id: role._id,
    created_by: currentUserId,
    updated_by: currentUserId,
  });

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

  const allMembers = await WorkspaceMemberModel.find({
    workspace_id: workspaceId,
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

  const self = allMembers.find(
    (m) => m.user_id._id.toString() === currentUserId
  );
  const subordinates = allMembers.filter(
    (m) => m.role_id.level > currentUserLevel
  );

  const total = subordinates.length;
  const paginated = subordinates.slice(skip, skip + limit);

  return {
    self,
    members: paginated,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
