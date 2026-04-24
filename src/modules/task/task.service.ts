import mongoose from "mongoose";
import { TaskModel } from "./task.model.js";
import { ProjectModel } from "../project/project.model.js";
import { WorkspaceMemberModel } from "../workspaceMember/workspaceMember.model.js";
import { AppError } from "../../errors/appError.js";
import { logger } from "../../utils/logger.js";
import { redis, KEYS } from "../../config/redis.js";
import type { TaskPriority } from "./task.types.js";
import { logActivity } from "../activity/activity.service.js";
import { UserModel } from "../user/user.model.js";

const validateProjectInWorkspace = async (projectId: string, workspaceId: string) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new AppError("Invalid project id", 400, "INVALID_ID");
  }
  const project = await ProjectModel.findOne({ _id: projectId, workspace_id: workspaceId }).lean();
  if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");
  return project;
};

const validateWorkspaceMember = async (userId: string, workspaceId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid assigned_to id", 400, "INVALID_ID");
  }
  const isMember = await WorkspaceMemberModel.findOne({ user_id: userId, workspace_id: workspaceId }).lean();
  if (!isMember) throw new AppError("Assigned user is not a workspace member", 400, "NOT_A_MEMBER");
};

// Generate next task key using Redis atomic counter: PROJECT_KEY-N
const getNextTaskKey = async (projectId: string, projectKey: string): Promise<string> => {
  const count = await redis.incr(KEYS.taskCounter(projectId));
  return `${projectKey}-${count}`;
};

export const createTask = async ({
  title,
  description,
  projectId,
  workspaceId,
  assignedTo,
  priority,
  labels,
  due,
  userId,
}: {
  title: string;
  description?: string;
  projectId: string;
  workspaceId: string;
  assignedTo?: string;
  priority?: TaskPriority;
  labels?: string[];
  due?: string;
  userId: string;
}) => {
  const project = await validateProjectInWorkspace(projectId, workspaceId);
  if (assignedTo) await validateWorkspaceMember(assignedTo, workspaceId);

  const projectKey = (project as any).key ?? "TASK";
  const taskKey    = await getNextTaskKey(projectId, projectKey);

  const task = await TaskModel.create({
    key:          taskKey,
    title,
    description,
    project_id:   projectId,
    workspace_id: workspaceId,
    assigned_to:  assignedTo || undefined,
    status:       "todo",
    priority:     priority ?? "med",
    labels:       labels ?? [],
    due:          due ? new Date(due) : undefined,
    created_by:   userId,
    updated_by:   userId,
  });

  UserModel.findById(userId).select("name").lean().then((u) => {
    logActivity({ workspaceId, actorId: userId, actorName: u?.name ?? "", verb: "created", target: taskKey, targetType: "task" });
  }).catch(() => {});
  logger.info("task.created", { taskId: task._id, key: taskKey, projectId, workspaceId, userId });
  return task;
};

const TASK_POPULATE = {
  path: "assigned_to",
  select: "name email",
};

const TASK_SELECT = "key title description status priority labels due assigned_to project_id workspace_id created_by created_at updated_at";

export const getTasks = async ({
  projectId,
  workspaceId,
  page = 1,
  limit = 100,
}: {
  projectId: string;
  workspaceId: string;
  page?: number;
  limit?: number;
}) => {
  await validateProjectInWorkspace(projectId, workspaceId);

  const skip = (page - 1) * limit;

  const [total, tasks] = await Promise.all([
    TaskModel.countDocuments({ project_id: projectId, workspace_id: workspaceId }),
    TaskModel.find({ project_id: projectId, workspace_id: workspaceId })
      .select(TASK_SELECT)
      .populate<{ assigned_to: { _id: string; name: string; email: string } }>(TASK_POPULATE)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { tasks, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getTask = async ({
  taskId,
  projectId,
  workspaceId,
}: {
  taskId: string;
  projectId: string;
  workspaceId: string;
}) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new AppError("Invalid task id", 400, "INVALID_ID");
  }

  const task = await TaskModel.findOne({ _id: taskId, project_id: projectId, workspace_id: workspaceId })
    .select(TASK_SELECT)
    .populate<{ assigned_to: { _id: string; name: string; email: string } }>(TASK_POPULATE)
    .lean();

  if (!task) throw new AppError("Task not found", 404, "NOT_FOUND");
  return task;
};

export const updateTask = async ({
  taskId,
  projectId,
  workspaceId,
  userId,
  updates,
}: {
  taskId: string;
  projectId: string;
  workspaceId: string;
  userId: string;
  updates: {
    title?: string;
    description?: string;
    status?: string;
    priority?: TaskPriority;
    labels?: string[];
    due?: string | null;
  };
}) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new AppError("Invalid task id", 400, "INVALID_ID");
  }

  const patch: Record<string, any> = { ...updates, updated_by: userId };
  if ("due" in updates) {
    patch.due = updates.due ? new Date(updates.due) : null;
  }

  const task = await TaskModel.findOneAndUpdate(
    { _id: taskId, project_id: projectId, workspace_id: workspaceId },
    patch,
    { returnDocument: "after" }
  )
    .select(TASK_SELECT)
    .lean();

  if (!task) throw new AppError("Task not found", 404, "NOT_FOUND");
  if (updates.status) {
    const statusLabel: Record<string, string> = { todo: "Todo", in_progress: "In Progress", done: "Done" };
    UserModel.findById(userId).select("name").lean().then((u) => {
      logActivity({ workspaceId, actorId: userId, actorName: u?.name ?? "", verb: "moved", target: (task as any).key ?? taskId, targetType: "task", to: statusLabel[updates.status!] });
    }).catch(() => {});
  }
  logger.info("task.updated", { taskId, userId });
  return task;
};

export const deleteTask = async ({
  taskId,
  projectId,
  workspaceId,
  userId,
}: {
  taskId: string;
  projectId: string;
  workspaceId: string;
  userId: string;
}) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new AppError("Invalid task id", 400, "INVALID_ID");
  }

  const task = await TaskModel.findOneAndDelete({ _id: taskId, project_id: projectId, workspace_id: workspaceId }).lean();
  if (!task) throw new AppError("Task not found", 404, "NOT_FOUND");

  logger.info("task.deleted", { taskId, userId });
  return task;
};

export const assignTask = async ({
  taskId,
  projectId,
  workspaceId,
  assignedTo,
  userId,
}: {
  taskId: string;
  projectId: string;
  workspaceId: string;
  assignedTo: string;
  userId: string;
}) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new AppError("Invalid task id", 400, "INVALID_ID");
  }

  await validateWorkspaceMember(assignedTo, workspaceId);

  const task = await TaskModel.findOneAndUpdate(
    { _id: taskId, project_id: projectId, workspace_id: workspaceId },
    { assigned_to: assignedTo, updated_by: userId },
    { returnDocument: "after" }
  )
    .select(TASK_SELECT)
    .lean();

  if (!task) throw new AppError("Task not found", 404, "NOT_FOUND");
  logger.info("task.assigned", { taskId, assignedTo, userId });
  return task;
};
