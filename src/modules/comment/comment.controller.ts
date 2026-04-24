import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { z } from "zod";
import { AppError } from "../../errors/appError.js";
import { getComments, addComment } from "./comment.service.js";

const addCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty").max(5000),
});

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    const comments = await getComments({
      taskId:      req.params.task_id as string,
      projectId:   req.params.project_id as string,
      workspaceId: req.workspace.id,
    });
    return res.status(200).json({ success: true, message: "Comments fetched successfully", data: comments });
  } catch (err) {
    return next(err);
  }
};

export const add = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id || !req.workspace) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    const { body } = addCommentSchema.parse(req.body);
    const comment = await addComment({
      body,
      taskId:      req.params.task_id as string,
      projectId:   req.params.project_id as string,
      workspaceId: req.workspace.id,
      authorId:    req.user.id,
    });
    return res.status(201).json({ success: true, message: "Comment added", data: comment });
  } catch (err: any) {
    if (err instanceof ZodError) return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    return next(err);
  }
};
