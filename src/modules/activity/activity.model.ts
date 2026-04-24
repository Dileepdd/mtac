import { Schema, model } from "mongoose";
import { IActivity } from "./activity.types.js";

const activitySchema = new Schema<IActivity>(
  {
    workspace_id: { type: Schema.Types.ObjectId, required: true, ref: "Workspace", index: true },
    actor_id:     { type: Schema.Types.ObjectId, required: true, ref: "User" },
    actor_name:   { type: String, required: true },
    verb:         { type: String, required: true },
    target:       { type: String, required: true },
    target_type:  { type: String, required: true, enum: ["task", "project", "member"] },
    to:           { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    versionKey: false,
  }
);

// TTL index: auto-delete activity events older than 90 days
activitySchema.index({ created_at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const ActivityModel = model<IActivity>("Activity", activitySchema);
