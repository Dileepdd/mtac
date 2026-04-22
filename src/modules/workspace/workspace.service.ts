import mongoose from "mongoose";
import { WorkspaceModel } from "./workspace.model.js";
import { RoleModel } from "../role/role.model.js";
import { WorkspaceMemberModel } from "../workspaceMember/workspaceMember.model.js";
import { PermissionModel } from "../permission/permission.model.js";
import { ProjectModel } from "../project/project.model.js";
import { TaskModel } from "../task/task.model.js";
import { ROLE_CONFIG } from "../../config/roles.js";
import { IRole } from "../role/roles.types.js";
import { AppError } from "../../errors/appError.js";
import { logger } from "../../utils/logger.js";

export const createWorkspace = async (userId: string, name: string) => {
  const session = await mongoose.startSession();

  try {
    try {
      let createdWorkspace: { _id: unknown; name: string } | null = null;

      await session.withTransaction(async () => {
        createdWorkspace = await createWorkspaceGraph(userId, name, session);
      });

      if (!createdWorkspace) {
        throw new AppError("Workspace creation failed", 500, "WORKSPACE_CREATE_FAILED");
      }

      const workspaceResult = createdWorkspace as { _id: unknown; name: string };
      logger.info("workspace.created", { workspaceId: workspaceResult._id, name: workspaceResult.name, userId });
      return { id: workspaceResult._id, name: workspaceResult.name };
    } catch (err: any) {
      if (!isTransactionUnsupportedError(err)) throw err;

      // Local standalone MongoDB does not support transactions.
      // Fallback keeps local development usable while production can run with transactions.
      const createdWorkspace = await createWorkspaceGraph(userId, name);
      logger.info("workspace.created", { workspaceId: createdWorkspace._id, name: createdWorkspace.name, userId });
      return { id: createdWorkspace._id, name: createdWorkspace.name };
    }
  } finally {
    await session.endSession();
  }
};

const createWorkspaceGraph = async (
  userId: string,
  name: string,
  session?: mongoose.ClientSession
) => {
  const permissionsQuery = PermissionModel.find().select("_id name");
  const permissions = session
    ? await permissionsQuery.session(session).lean()
    : await permissionsQuery.lean();

  if (!permissions.length) {
    throw new AppError("Permissions not seeded", 500, "PERMISSIONS_NOT_SEEDED");
  }

  const workspaceExistsQuery = WorkspaceModel.findOne({ name, created_by: userId });
  const workspaceExists = session
    ? await workspaceExistsQuery.session(session).lean()
    : await workspaceExistsQuery.lean();

  if (workspaceExists) {
    throw new AppError("Workspace with this name already exists", 409, "WORKSPACE_EXISTS");
  }

  const [workspace] = session
    ? await WorkspaceModel.create([{ name, created_by: userId }], { session })
    : await WorkspaceModel.create([{ name, created_by: userId }]);

  const workspaceId = workspace._id;
  const permMap = new Map(permissions.map((p) => [p.name, p._id]));
  const createdRoles: IRole[] = [];

  for (const [roleName, roleData] of Object.entries(ROLE_CONFIG)) {
    const permissionIds =
      roleData.permissions === "ALL"
        ? permissions.map((p) => p._id)
        : roleData.permissions.map((permissionName) => {
            const id = permMap.get(permissionName);
            if (!id) throw new AppError(`Permission not found: ${permissionName}`, 500, "INTERNAL_ERROR");
            return id;
          });

    const [role] = session
      ? await RoleModel.create([{ name: roleName, level: roleData.level, workspace_id: workspaceId, created_by: userId, permissions: permissionIds }], { session })
      : await RoleModel.create([{ name: roleName, level: roleData.level, workspace_id: workspaceId, created_by: userId, permissions: permissionIds }]);

    createdRoles.push(role);
  }

  const adminRole = createdRoles.find((r) => r.name === "admin");
  if (!adminRole) throw new AppError("Admin role not created", 500, "INTERNAL_ERROR");

  if (session) {
    await WorkspaceMemberModel.create(
      [{ user_id: userId, workspace_id: workspaceId, role_id: adminRole._id, created_by: userId, updated_by: userId }],
      { session }
    );
  } else {
    await WorkspaceMemberModel.create({
      user_id: userId, workspace_id: workspaceId, role_id: adminRole._id, created_by: userId, updated_by: userId,
    });
  }

  return { _id: workspace._id, name: workspace.name };
};

const isTransactionUnsupportedError = (err: any) => {
  const message = err?.message?.toLowerCase?.() ?? "";
  return (
    message.includes("transaction numbers are only allowed on a replica set member") ||
    message.includes("replica set") ||
    err?.codeName === "IllegalOperation"
  );
};

export const getWorkspace = async (workspaceId: string) => {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    throw new AppError("Invalid workspace id", 400, "INVALID_ID");
  }

  const workspace = await WorkspaceModel.findById(workspaceId)
    .select("name created_by created_at")
    .lean();

  if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");
  return workspace;
};

export const getAllWorkspaces = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [total, memberships] = await Promise.all([
    WorkspaceMemberModel.countDocuments({ user_id: userId }),
    WorkspaceMemberModel.find({ user_id: userId })
      .select("workspace_id role_id")
      .populate<{ workspace_id: { _id: string; name: string; created_at: Date } }>({ path: "workspace_id", select: "name created_at" })
      .populate<{ role_id: { _id: string; name: string } }>({ path: "role_id", select: "name" })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    workspaces: memberships.map((m) => ({
      id: m.workspace_id._id,
      name: m.workspace_id.name,
      created_at: m.workspace_id.created_at,
      role: m.role_id.name,
    })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const deleteWorkspace = async (workspaceId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    throw new AppError("Invalid workspace id", 400, "INVALID_ID");
  }

  const workspace = await WorkspaceModel.findByIdAndDelete(workspaceId).lean();
  if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

  await Promise.all([
    RoleModel.deleteMany({ workspace_id: workspaceId }),
    WorkspaceMemberModel.deleteMany({ workspace_id: workspaceId }),
    ProjectModel.deleteMany({ workspace_id: workspaceId }),
    TaskModel.deleteMany({ workspace_id: workspaceId }),
  ]);

  logger.info("workspace.deleted", { workspaceId, userId });
  return workspace;
};
