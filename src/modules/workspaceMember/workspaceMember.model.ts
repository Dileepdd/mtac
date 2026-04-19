import { Schema, model } from "mongoose";
import { IWorkspaceMember } from "./workspaceMember.types.js";

const workspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "User",
    },
    workspace_id: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "Workspace",
    },
    role_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Role",
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updated_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    versionKey: false,
  }
);

workspaceMemberSchema.index({ workspace_id: 1, user_id: 1 }, { unique: true });
workspaceMemberSchema.index({ workspace_id: 1, role_id: 1 });

export const WorkspaceMemberModel = model<IWorkspaceMember>(
  "WorkspaceMember",
  workspaceMemberSchema
);
