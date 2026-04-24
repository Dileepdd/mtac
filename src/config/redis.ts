import { Redis } from "@upstash/redis";
import { env } from "./env.js";

export const redis = new Redis({
  url: env.REDIS_REST_URL,
  token: env.REDIS_REST_TOKEN,
});

// ─── Key builders ─────────────────────────────────────────────────────────────

export const KEYS = {
  // Cached workspace membership + permissions for a user
  wsMember: (workspaceId: string, userId: string) =>
    `ws_member:${workspaceId}:${userId}`,

  // All member keys for a workspace (for bulk invalidation when a role's permissions change)
  wsMemberPattern: (workspaceId: string) =>
    `ws_member:${workspaceId}:*`,

  // Workspace stats
  wsStats: (workspaceId: string) =>
    `ws_stats:${workspaceId}`,

  // Task counter per project (for auto-incrementing task key)
  taskCounter: (projectId: string) =>
    `task_counter:${projectId}`,
};

// TTLs in seconds
export const TTL = {
  MEMBER_PERMS: 300,  // 5 min — invalidated on role/member change
  WS_STATS:     60,   // 1 min — stale stats are acceptable
};
