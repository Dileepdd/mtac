import mongoose from "mongoose";
import { TaskModel } from "./task.model.js";
import { ProjectModel } from "../project/project.model.js";
import { WorkspaceMemberModel } from "../workspaceMember/workspaceMember.model.js";
import { AppError } from "../../errors/appError.js";
import { logger } from "../../utils/logger.js";

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

export const createTask = async ({
  title,
  description,
  projectId,
  workspaceId,
  assignedTo,
  userId,
}: {
  title: string;
  description?: string;
  projectId: string;
  workspaceId: string;
  assignedTo?: string;
  userId: string;
}) => {
  await validateProjectInWorkspace(projectId, workspaceId);
  if (assignedTo) await validateWorkspaceMember(assignedTo, workspaceId);

  const task = await TaskModel.create({
    title,
    description,
    project_id: projectId,
    workspace_id: workspaceId,
    assigned_to: assignedTo || undefined,
    status: "todo",
    created_by: userId,
    updated_by: userId,
  });

  logger.info("task.created", { taskId: task._id, projectId, workspaceId, userId });
  return task;
};

export const getTasks = async ({
  projectId,
  workspaceId,
  page = 1,
  limit = 20,
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
      .select("title description status assigned_to created_by created_at updated_at")
      .populate<{ assigned_to: { _id: string; name: string } }>({ path: "assigned_to", select: "name" })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    tasks,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
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
    .populate<{ assigned_to: { _id: string; name: string } }>({ path: "assigned_to", select: "name" })
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
  updates: { title?: string; description?: string; status?: string };
}) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new AppError("Invalid task id", 400, "INVALID_ID");
  }

  const task = await TaskModel.findOneAndUpdate(
    { _id: taskId, project_id: projectId, workspace_id: workspaceId },
    { ...updates, updated_by: userId },
    { returnDocument: "after" }
  ).lean();

  if (!task) throw new AppError("Task not found", 404, "NOT_FOUND");
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
  ).lean();

  if (!task) throw new AppError("Task not found", 404, "NOT_FOUND");
  logger.info("task.assigned", { taskId, assignedTo, userId });
  return task;
};
