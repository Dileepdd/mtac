import mongoose from "mongoose";
import { ProjectModel } from "./project.model.js";
import { TaskModel } from "../task/task.model.js";
import { AppError } from "../../errors/appError.js";
import { logger } from "../../utils/logger.js";
import { logActivity } from "../activity/activity.service.js";

const COLOR_PALETTE = [
  "#4f46e5","#7c3aed","#059669","#b45309",
  "#be123c","#0891b2","#c2410c","#15803d",
];

// Derive a short key from the project name
function deriveKey(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 4);
}

// Ensure the key is unique within the workspace; append a number if needed
async function uniqueKey(base: string, workspaceId: string, excludeId?: string): Promise<string> {
  let candidate = base;
  let suffix    = 2;
  while (true) {
    const filter: Record<string, any> = { key: candidate, workspace_id: workspaceId };
    if (excludeId) filter._id = { $ne: excludeId };
    const exists = await ProjectModel.findOne(filter).select("_id").lean();
    if (!exists) return candidate;
    candidate = `${base.slice(0, 4)}${suffix++}`;
  }
}

// Aggregates taskCount and done for a list of project IDs
async function enrichWithTaskCounts(projects: any[]) {
  if (!projects.length) return projects;
  const ids = projects.map((p) => p._id);

  const agg = await TaskModel.aggregate([
    { $match: { project_id: { $in: ids } } },
    { $group: {
      _id:       "$project_id",
      taskCount: { $sum: 1 },
      done:      { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
    }},
  ]);

  const countMap = new Map(agg.map((a) => [a._id.toString(), { taskCount: a.taskCount, done: a.done }]));

  return projects.map((p) => {
    const counts = countMap.get(p._id.toString()) ?? { taskCount: 0, done: 0 };
    return { ...p, ...counts };
  });
}

export const createProject = async ({
  name,
  workspaceId,
  userId,
  key: rawKey,
  color,
}: {
  name: string;
  workspaceId: string;
  userId: string;
  key?: string;
  color?: string;
}) => {
  const existing = await ProjectModel.findOne({ name, workspace_id: workspaceId }).lean();
  if (existing) throw new AppError("Project with this name already exists", 409, "ALREADY_EXISTS");

  const baseKey    = rawKey ? rawKey.toUpperCase() : deriveKey(name);
  const finalKey   = await uniqueKey(baseKey, workspaceId);
  const paletteIdx = await ProjectModel.countDocuments({ workspace_id: workspaceId });
  const finalColor = color ?? COLOR_PALETTE[paletteIdx % COLOR_PALETTE.length];

  const project = await ProjectModel.create({
    name,
    key:          finalKey,
    color:        finalColor,
    workspace_id: workspaceId,
    created_by:   userId,
  });

  logActivity({ workspaceId, actorId: userId, actorName: "", verb: "created", target: project.name, targetType: "project" });
  logger.info("project.created", { projectId: project._id, key: finalKey, workspaceId, userId });
  return project;
};

export const getProjects = async ({
  workspaceId,
  page = 1,
  limit = 50,
}: {
  workspaceId: string;
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;
  const [total, projects] = await Promise.all([
    ProjectModel.countDocuments({ workspace_id: workspaceId }),
    ProjectModel.find({ workspace_id: workspaceId })
      .select("name key color created_by created_at updated_at")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const enriched = await enrichWithTaskCounts(projects);
  return { projects: enriched, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getProject = async ({
  projectId,
  workspaceId,
}: {
  projectId: string;
  workspaceId: string;
}) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new AppError("Invalid project id", 400, "INVALID_ID");
  }
  const project = await ProjectModel.findOne({ _id: projectId, workspace_id: workspaceId })
    .select("name key color created_by created_at updated_at")
    .lean();
  if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

  const [enriched] = await enrichWithTaskCounts([project]);
  return enriched;
};

export const updateProject = async ({
  projectId,
  workspaceId,
  name,
  color,
}: {
  projectId: string;
  workspaceId: string;
  name?: string;
  color?: string;
}) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new AppError("Invalid project id", 400, "INVALID_ID");
  }

  if (name) {
    const conflict = await ProjectModel.findOne({ name, workspace_id: workspaceId, _id: { $ne: projectId } }).lean();
    if (conflict) throw new AppError("Project with this name already exists", 409, "ALREADY_EXISTS");
  }

  const patch: Record<string, any> = {};
  if (name)  patch.name  = name;
  if (color) patch.color = color;

  const project = await ProjectModel.findOneAndUpdate(
    { _id: projectId, workspace_id: workspaceId },
    patch,
    { returnDocument: "after" }
  ).lean();

  if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");
  logger.info("project.updated", { projectId, workspaceId });
  return project;
};

export const deleteProject = async ({
  projectId,
  workspaceId,
  userId,
}: {
  projectId: string;
  workspaceId: string;
  userId: string;
}) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new AppError("Invalid project id", 400, "INVALID_ID");
  }
  const project = await ProjectModel.findOneAndDelete({ _id: projectId, workspace_id: workspaceId }).lean();
  if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

  await TaskModel.deleteMany({ project_id: projectId });
  logger.info("project.deleted", { projectId, workspaceId, userId });
  return project;
};
