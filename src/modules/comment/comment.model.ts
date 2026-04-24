import { Schema, model } from "mongoose";
import { IComment } from "./comment.types.js";

const commentSchema = new Schema<IComment>(
  {
    body:         { type: String, required: true, trim: true, maxlength: 5000 },
    author_id:    { type: Schema.Types.ObjectId, required: true, ref: "User" },
    task_id:      { type: Schema.Types.ObjectId, required: true, ref: "Task", index: true },
    project_id:   { type: Schema.Types.ObjectId, required: true, ref: "Project" },
    workspace_id: { type: Schema.Types.ObjectId, required: true, ref: "Workspace", index: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

export const CommentModel = model<IComment>("Comment", commentSchema);
