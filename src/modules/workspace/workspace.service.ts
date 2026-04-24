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
import { redis, KEYS, TTL } from "../../config/redis.js";
import type { WorkspaceSettings } from "./workspace.types.js";

// ─── Slug generation ─────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 48);
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let suffix    = 2;
  while (await WorkspaceModel.findOne({ slug: candidate }).select("_id").lean()) {
    candidate = `${base.slice(0, 44)}-${suffix++}`;
  }
  return candidate;
}

// ─── Create ──────────────────────────────────────────────────────────────────

export const createWorkspace = async (userId: string, name: string) => {
  const session = await mongoose.startSession();
  const slug    = await uniqueSlug(toSlug(name));

  try {
    try {
      let created: { _id: unknown; name: string; slug: string } | null = null;
      await session.withTransaction(async () => {
        created = await createWorkspaceGraph(userId, name, slug, session);
      });
      if (!created) throw new AppError("Workspace creation failed", 500, "WORKSPACE_CREATE_FAILED");
      const ws = created as { _id: unknown; name: string; slug: string };
      logger.info("workspace.created", { workspaceId: ws._id, name: ws.name, userId });
      return ws;
    } catch (err: any) {
      if (!isTransactionUnsupportedError(err)) throw err;
      const ws = await createWorkspaceGraph(userId, name, slug);
      logger.info("workspace.created", { workspaceId: ws._id, name: ws.name, userId });
      return ws;
    }
  } finally {
    await session.endSession();
  }
};

const createWorkspaceGraph = async (
  userId: string,
  name: string,
  slug: string,
  session?: mongoose.ClientSession
) => {
  const permissionsQuery = PermissionModel.find().select("_id name");
  const permissions = session ? await permissionsQuery.session(session).lean() : await permissionsQuery.lean();
  if (!permissions.length) throw new AppError("Permissions not seeded", 500, "PERMISSIONS_NOT_SEEDED");

  const workspaceExistsQuery = WorkspaceModel.findOne({ name, created_by: userId });
  const workspaceExists = session ? await workspaceExistsQuery.session(session).lean() : await workspaceExistsQuery.lean();
  if (workspaceExists) throw new AppError("Workspace with this name already exists", 409, "WORKSPACE_EXISTS");

  const [workspace] = session
    ? await WorkspaceModel.create([{ name, slug, created_by: userId }], { session })
    : await WorkspaceModel.create([{ name, slug, created_by: userId }]);

  const workspaceId = workspace._id;
  const permMap     = new Map(permissions.map((p) => [p.name, p._id]));
  const createdRoles: IRole[] = [];

  for (const [roleName, roleData] of Object.entries(ROLE_CONFIG)) {
    const isAllPermissions = roleData.permissions === "ALL";
    const permissionIds    = isAllPermissions
      ? []
      : roleData.permissions.map((pn) => {
          const id = permMap.get(pn);
          if (!id) throw new AppError(`Permission not found: ${pn}`, 500, "INTERNAL_ERROR");
          return id;
        });

    const [role] = session
      ? await RoleModel.create([{ name: roleName, level: roleData.level, workspace_id: workspaceId, created_by: userId, permissions: permissionIds, all_permissions: isAllPermissions }], { session })
      : await RoleModel.create([{ name: roleName, level: roleData.level, workspace_id: workspaceId, created_by: userId, permissions: permissionIds, all_permissions: isAllPermissions }]);

    createdRoles.push(role);
  }

  const adminRole = createdRoles.find((r) => r.name === "admin");
  if (!adminRole) throw new AppError("Admin role not created", 500, "INTERNAL_ERROR");

  if (session) {
    await WorkspaceMemberModel.create([{ user_id: userId, workspace_id: workspaceId, role_id: adminRole._id, created_by: userId, updated_by: userId }], { session });
  } else {
    await WorkspaceMemberModel.create({ user_id: userId, workspace_id: workspaceId, role_id: adminRole._id, created_by: userId, updated_by: userId });
  }

  return { _id: workspace._id, name: workspace.name, slug: workspace.slug };
};

const isTransactionUnsupportedError = (err: any) => {
  const msg = err?.message?.toLowerCase?.() ?? "";
  return (
    msg.includes("transaction numbers are only allowed on a replica set member") ||
    msg.includes("replica set") ||
    err?.codeName === "IllegalOperation"
  );
};

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getWorkspace = async (workspaceId: string) => {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) throw new AppError("Invalid workspace id", 400, "INVALID_ID");
  const workspace = await WorkspaceModel.findById(workspaceId).select("name slug settings created_by created_at").lean();
  if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");
  return workspace;
};

export const getAllWorkspaces = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [total, memberships] = await Promise.all([
    WorkspaceMemberModel.countDocuments({ user_id: userId }),
    WorkspaceMemberModel.find({ user_id: userId })
      .select("workspace_id role_id")
      .populate<{ workspace_id: { _id: string; name: string; slug: string; created_at: Date } }>({ path: "workspace_id", select: "name slug created_at" })
      .populate<{ role_id: { _id: string; name: string; level: number; all_permissions: boolean; permissions: { name: string }[] } }>({ path: "role_id", select: "name level all_permissions", populate: { path: "permissions", select: "name" } })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  // Count members per workspace
  const wsIds = memberships.map((m) => m.workspace_id._id);
  const memberCounts = await WorkspaceMemberModel.aggregate([
    { $match: { workspace_id: { $in: wsIds } } },
    { $group: { _id: "$workspace_id", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(memberCounts.map((c) => [c._id.toString(), c.count]));

  return {
    workspaces: memberships.map((m) => ({
      _id:         m.workspace_id._id,
      name:        m.workspace_id.name,
      slug:        m.workspace_id.slug,
      created_at:  m.workspace_id.created_at,
      memberCount: countMap.get(m.workspace_id._id.toString()) ?? 1,
      role: {
        _id:           m.role_id._id,
        name:          m.role_id.name,
        level:         m.role_id.level,
        is_system:     m.role_id.all_permissions ?? false,
        permissions:   m.role_id.permissions?.map((p) => p.name) ?? [],
      },
    })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateWorkspace = async (workspaceId: string, userId: string, patch: { name?: string; settings?: WorkspaceSettings }) => {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) throw new AppError("Invalid workspace id", 400, "INVALID_ID");

  const update: Record<string, any> = {};
  if (patch.name) {
    const conflict = await WorkspaceModel.findOne({ name: patch.name, created_by: userId, _id: { $ne: workspaceId } }).lean();
    if (conflict) throw new AppError("You already have a workspace with this name", 409, "WORKSPACE_EXISTS");
    update.name = patch.name;
  }
  if (patch.settings) {
    // Merge settings — only update provided fields
    const fields = ["accent", "font", "density", "timezone", "date_format", "language"] as const;
    for (const f of fields) {
      if (f in patch.settings) update[`settings.${f}`] = (patch.settings as any)[f];
    }
  }

  const workspace = await WorkspaceModel.findByIdAndUpdate(workspaceId, update, { returnDocument: "after" }).select("name slug settings").lean();
  if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

  logger.info("workspace.updated", { workspaceId, userId });
  return workspace;
};

// ─── Stats (Redis-cached) ─────────────────────────────────────────────────────

export const getWorkspaceStats = async (workspaceId: string) => {
  const cacheKey = KEYS.wsStats(workspaceId);
  const cached   = await redis.get<Record<string, number>>(cacheKey);
  if (cached) return cached;

  const [projectCount, memberCount, openTaskCount, completedThisWeek] = await Promise.all([
    ProjectModel.countDocuments({ workspace_id: workspaceId }),
    WorkspaceMemberModel.countDocuments({ workspace_id: workspaceId }),
    TaskModel.countDocuments({ workspace_id: workspaceId, status: { $ne: "done" } }),
    TaskModel.countDocuments({
      workspace_id: workspaceId,
      status:       "done",
      updated_at:   { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  const stats = { projectCount, memberCount, openTaskCount, completedThisWeek };
  await redis.set(cacheKey, stats, { ex: TTL.WS_STATS });
  return stats;
};

// ─── Delete ───────────────────────────────────────────────────────────────────

export const deleteWorkspace = async (workspaceId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) throw new AppError("Invalid workspace id", 400, "INVALID_ID");
  const workspace = await WorkspaceModel.findByIdAndDelete(workspaceId).lean();
  if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

  await Promise.all([
    RoleModel.deleteMany({ workspace_id: workspaceId }),
    WorkspaceMemberModel.deleteMany({ workspace_id: workspaceId }),
    ProjectModel.deleteMany({ workspace_id: workspaceId }),
    TaskModel.deleteMany({ workspace_id: workspaceId }),
  ]);

  // Clear all cached memberships for this workspace
  await redis.del(KEYS.wsStats(workspaceId));

  logger.info("workspace.deleted", { workspaceId, userId });
  return workspace;
};
