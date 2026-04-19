import { Schema, model } from "mongoose";
import { IProject } from "./project.types.js";

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    workspace_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Workspace",
      index: true,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
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

export const ProjectModel = model<IProject>("Project", projectSchema);
