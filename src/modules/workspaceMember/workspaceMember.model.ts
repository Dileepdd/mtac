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
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    versionKey: false,
  }
);

export const WorkspaceMemberModel = model<IWorkspaceMember>(
  "WorkspaceMember",
  workspaceMemberSchema
);
