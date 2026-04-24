import { ActivityModel } from "./activity.model.js";
import type { ActivityVerb, ActivityTargetType } from "./activity.types.js";
import { logger } from "../../utils/logger.js";

export interface LogActivityParams {
  workspaceId: string;
  actorId:     string;
  actorName:   string;
  verb:        ActivityVerb;
  target:      string;
  targetType:  ActivityTargetType;
  to?:         string;
}

// Fire-and-forget — never throws so it never breaks the calling request
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await ActivityModel.create({
      workspace_id: params.workspaceId,
      actor_id:     params.actorId,
      actor_name:   params.actorName,
      verb:         params.verb,
      target:       params.target,
      target_type:  params.targetType,
      to:           params.to,
    });
  } catch (err) {
    logger.error("activity.log_failed", { error: err instanceof Error ? err.message : String(err) });
  }
}

export async function getActivity(workspaceId: string, limit = 30) {
  return ActivityModel
    .find({ workspace_id: workspaceId })
    .sort({ created_at: -1 })
    .limit(limit)
    .lean();
}
