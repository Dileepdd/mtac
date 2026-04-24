import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { WorkspaceMemberModel } from "../modules/workspaceMember/workspaceMember.model.js";
import { AppError } from "../errors/appError.js";
import { redis, KEYS, TTL } from "../config/redis.js";

interface CachedMemberData {
  id: string;
  roleId: string;
  level: number;
  allPermissions: boolean;
  permissions: string[];
}

export const workspaceMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const userId      = req.user?.id;
    const workspaceId = req.params.workspace_id as string;

    if (!userId) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));

    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return next(new AppError("Invalid workspace id", 400, "INVALID_ID"));
    }

    // ── Try Redis cache first ──────────────────────────────────────────────
    const cacheKey = KEYS.wsMember(workspaceId, userId);
    const cached   = await redis.get<CachedMemberData>(cacheKey);

    if (cached) {
      req.workspace = cached;
      return next();
    }

    // ── Cache miss — fetch from DB ─────────────────────────────────────────
    const membership = await WorkspaceMemberModel.findOne({
      user_id: userId,
      workspace_id: workspaceId,
    })
      .select("role_id")
      .populate<{
        role_id: {
          _id: string;
          level: number;
          all_permissions: boolean;
          permissions: { name: string }[];
        };
      }>({
        path: "role_id",
        select: "level all_permissions permissions",
        populate: { path: "permissions", select: "name" },
      })
      .lean();

    if (!membership) {
      return next(new AppError("Not a workspace member", 403, "FORBIDDEN"));
    }

    const role = membership.role_id;
    const data: CachedMemberData = {
      id:             workspaceId,
      roleId:         role._id.toString(),
      level:          role.level,
      allPermissions: role.all_permissions ?? false,
      permissions:    role.permissions.map((p) => p.name),
    };

    // Store in Redis with TTL
    await redis.set(cacheKey, data, { ex: TTL.MEMBER_PERMS });

    req.workspace = data;
    next();
  } catch (err) {
    next(err);
  }
};

// ─── Cache invalidation helpers (called by role + member services) ────────────

/** Invalidate one user's cached membership in a workspace */
export async function invalidateMemberCache(workspaceId: string, userId: string) {
  await redis.del(KEYS.wsMember(workspaceId, userId));
}

/** Invalidate ALL cached memberships for a workspace (used when role permissions change) */
export async function invalidateWorkspaceMemberCache(workspaceId: string) {
  // Upstash REST API may return the cursor as a string ("0") rather than a number.
  // Use Number() so the do-while terminates correctly in both cases.
  let cursor = 0;
  do {
    const [nextCursor, keys] = await redis.scan(cursor, {
      match: KEYS.wsMemberPattern(workspaceId),
      count: 100,
    });
    cursor = Number(nextCursor);
    if (keys.length > 0) {
      await redis.del(...(keys as string[]));
    }
  } while (cursor !== 0);
}
