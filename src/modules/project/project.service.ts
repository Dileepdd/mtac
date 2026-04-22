import mongoose from "mongoose";
import { ProjectModel } from "./project.model.js";
import { TaskModel } from "../task/task.model.js";
import { AppError } from "../../errors/appError.js";
import { logger } from "../../utils/logger.js";

export const createProject = async ({
  name,
  workspaceId,
  userId,
}: {
  name: string;
  workspaceId: string;
  userId: string;
}) => {
  const existing = await ProjectModel.findOne({ name, workspace_id: workspaceId }).lean();
  if (existing) throw new AppError("Project with this name already exists", 409, "ALREADY_EXISTS");

  const project = await ProjectModel.create({ name, workspace_id: workspaceId, created_by: userId });
  logger.info("project.created", { projectId: project._id, workspaceId, userId });
  return project;
};

export const getProjects = async ({
  workspaceId,
  page = 1,
  limit = 20,
}: {
  workspaceId: string;
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;

  const [total, projects] = await Promise.all([
    ProjectModel.countDocuments({ workspace_id: workspaceId }),
    ProjectModel.find({ workspace_id: workspaceId })
      .select("name created_by created_at")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    projects,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
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

  const project = await ProjectModel.findOne({ _id: projectId, workspace_id: workspaceId }).lean();
  if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");
  return project;
};

export const updateProject = async ({
  projectId,
  workspaceId,
  name,
}: {
  projectId: string;
  workspaceId: string;
  name: string;
}) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new AppError("Invalid project id", 400, "INVALID_ID");
  }

  const conflict = await ProjectModel.findOne({
    name,
    workspace_id: workspaceId,
    _id: { $ne: projectId },
  }).lean();
  if (conflict) throw new AppError("Project with this name already exists", 409, "ALREADY_EXISTS");

  const project = await ProjectModel.findOneAndUpdate(
    { _id: projectId, workspace_id: workspaceId },
    { name },
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
