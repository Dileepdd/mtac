import { Schema, model } from "mongoose";
import { ITask } from "./task.types.js";

const taskSchema = new Schema<ITask>(
  {
    key: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["urgent", "high", "med", "low", "none"],
      default: "med",
    },
    labels: {
      type: [String],
      default: [],
    },
    due: {
      type: Date,
    },
    project_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Project",
      index: true,
    },
    workspace_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Workspace",
      index: true,
    },
    assigned_to: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    created_by: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    updated_by: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
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

// Unique task key per workspace
taskSchema.index({ key: 1, workspace_id: 1 }, { unique: true });

export const TaskModel = model<ITask>("Task", taskSchema);
