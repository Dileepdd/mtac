import { Schema, model } from "mongoose";
import { IWorkspace } from "./workspace.types.js";

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    created_by: {
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

export const WorkspaceModel = model<IWorkspace>("Workspace", workspaceSchema);
