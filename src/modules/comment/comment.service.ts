import mongoose from "mongoose";
import { CommentModel } from "./comment.model.js";
import { TaskModel } from "../task/task.model.js";
import { UserModel } from "../user/user.model.js";
import { AppError } from "../../errors/appError.js";
import { logActivity } from "../activity/activity.service.js";
import { logger } from "../../utils/logger.js";

const COMMENT_POPULATE = { path: "author_id", select: "name email hue" };

export const getComments = async ({
  taskId, projectId, workspaceId,
}: { taskId: string; projectId: string; workspaceId: string }) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) throw new AppError("Invalid task id", 400, "INVALID_ID");

  return CommentModel
    .find({ task_id: taskId, project_id: projectId, workspace_id: workspaceId })
    .select("body author_id created_at updated_at")
    .populate<{ author_id: { _id: string; name: string; email: string; hue: number } }>(COMMENT_POPULATE)
    .sort({ created_at: 1 })
    .lean();
};

export const addComment = async ({
  body, taskId, projectId, workspaceId, authorId,
}: {
  body: string;
  taskId: string;
  projectId: string;
  workspaceId: string;
  authorId: string;
}) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) throw new AppError("Invalid task id", 400, "INVALID_ID");

  const [task, author] = await Promise.all([
    TaskModel.findOne({ _id: taskId, project_id: projectId, workspace_id: workspaceId }).select("key").lean(),
    UserModel.findById(authorId).select("name").lean(),
  ]);
  if (!task) throw new AppError("Task not found", 404, "NOT_FOUND");

  const comment = await CommentModel.create({
    body,
    author_id:    authorId,
    task_id:      taskId,
    project_id:   projectId,
    workspace_id: workspaceId,
  });

  const actorName = author?.name ?? "";
  logActivity({ workspaceId, actorId: authorId, actorName, verb: "commented", target: (task as any).key ?? taskId, targetType: "task" });
  logger.info("comment.added", { commentId: comment._id, taskId, authorId });

  return CommentModel.findById(comment._id).populate<{ author_id: { _id: string; name: string; hue: number } }>(COMMENT_POPULATE).lean();
};
