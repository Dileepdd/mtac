import { Schema, model } from "mongoose";
import { IProject } from "./project.types.js";

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    key:  { type: String, required: true, trim: true, uppercase: true, maxlength: 6 },
    color: { type: String, required: true, default: "#4f46e5" },
    workspace_id: { type: Schema.Types.ObjectId, required: true, ref: "Workspace", index: true },
    created_by:   { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

projectSchema.index({ name: 1, workspace_id: 1 }, { unique: true });
projectSchema.index({ key:  1, workspace_id: 1 }, { unique: true });

export const ProjectModel = model<IProject>("Project", projectSchema);
