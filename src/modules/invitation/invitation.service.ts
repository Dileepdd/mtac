import { randomUUID } from "crypto";
import { InvitationModel } from "./invitation.model.js";
import { WorkspaceMemberModel } from "../workspaceMember/workspaceMember.model.js";
import { RoleModel } from "../role/role.model.js";
import { UserModel } from "../user/user.model.js";
import { WorkspaceModel } from "../workspace/workspace.model.js";
import { AppError } from "../../errors/appError.js";
import { sendInviteEmail } from "../notification/notification.service.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const createInvitation = async ({
  email,
  roleId,
  workspaceId,
  invitedById,
  currentUserLevel,
}: {
  email: string;
  roleId?: string;
  workspaceId: string;
  invitedById: string;
  currentUserLevel: number;
}) => {
  const existingUser = await UserModel.findOne({ email }).select("_id").lean();
  if (existingUser) {
    const alreadyMember = await WorkspaceMemberModel.exists({
      workspace_id: workspaceId,
      user_id: existingUser._id,
    });
    if (alreadyMember) throw new AppError("User is already a member of this workspace", 409, "ALREADY_EXISTS");
  }

  const role = await (roleId
    ? RoleModel.findOne({ _id: roleId, workspace_id: workspaceId }).select("_id level name").lean()
    : RoleModel.findOne({ name: "member", workspace_id: workspaceId }).select("_id level name").lean());

  if (!role) throw new AppError("Invalid role", 400, "INVALID_ROLE");
  if (role.level <= currentUserLevel) throw new AppError("You cannot assign this role", 403, "FORBIDDEN");

  // Cancel any pending invites for the same email + workspace before creating a new one
  await InvitationModel.updateMany(
    { email, workspace_id: workspaceId, status: "pending" },
    { status: "cancelled" }
  );

  const [workspace, inviter] = await Promise.all([
    WorkspaceModel.findById(workspaceId).select("name").lean(),
    UserModel.findById(invitedById).select("name").lean(),
  ]);

  if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");
  if (!inviter) throw new AppError("Inviter not found", 404, "NOT_FOUND");

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  await InvitationModel.create({
    token,
    email,
    workspace_id: workspaceId,
    role_id: role._id,
    invited_by: invitedById,
    status: "pending",
    expires_at: expiresAt,
  });

  const inviteLink = `${env.APP_URL}/invite/${token}`;

  await sendInviteEmail(email, {
    inviterName: inviter.name,
    workspaceName: workspace.name,
    inviteLink,
  });

  logger.info("invitation.sent", { email, workspaceId, invitedBy: invitedById });
  return { expiresAt, inviteLink };
};

export const acceptInvitation = async ({
  token,
  userId,
}: {
  token: string;
  userId: string;
}) => {
  const [invitation, user] = await Promise.all([
    InvitationModel.findOne({ token }).lean(),
    UserModel.findById(userId).select("email").lean(),
  ]);

  if (!invitation) throw new AppError("Invitation not found or already used", 404, "NOT_FOUND");
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  if (invitation.status !== "pending") {
    throw new AppError("This invitation has already been used or cancelled", 410, "INVITATION_USED");
  }
  if (invitation.expires_at < new Date()) {
    await InvitationModel.findByIdAndUpdate(invitation._id, { status: "cancelled" });
    throw new AppError("This invitation has expired", 410, "INVITATION_EXPIRED");
  }
  if (invitation.email !== user.email.toLowerCase()) {
    throw new AppError("This invitation was sent to a different email address", 403, "EMAIL_MISMATCH");
  }

  try {
    await WorkspaceMemberModel.create({
      user_id: userId,
      workspace_id: invitation.workspace_id,
      role_id: invitation.role_id,
      created_by: invitation.invited_by,
      updated_by: invitation.invited_by,
    });
  } catch (err: any) {
    if (err?.code === 11000) throw new AppError("You are already a member of this workspace", 409, "ALREADY_EXISTS");
    throw err;
  }

  await InvitationModel.findByIdAndUpdate(invitation._id, { status: "accepted" });

  logger.info("invitation.accepted", { token, userId, workspaceId: invitation.workspace_id });
  return { workspaceId: invitation.workspace_id.toString() };
};

export const getInviteInfo = async (token: string) => {
  const invitation = await InvitationModel.findOne({ token })
    .populate<{ workspace_id: { name: string } }>({ path: "workspace_id", select: "name" })
    .populate<{ invited_by: { name: string } }>({ path: "invited_by", select: "name" })
    .lean();

  if (!invitation) throw new AppError("Invitation not found", 404, "NOT_FOUND");
  if (invitation.status !== "pending") throw new AppError("This invitation is no longer valid", 410, "INVITATION_USED");
  if (invitation.expires_at < new Date()) throw new AppError("This invitation has expired", 410, "INVITATION_EXPIRED");

  return {
    workspaceName: (invitation.workspace_id as unknown as { name: string }).name,
    inviterName: (invitation.invited_by as unknown as { name: string }).name,
    email: invitation.email,
    expiresAt: invitation.expires_at,
  };
};
