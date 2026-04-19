import { Schema, model } from "mongoose";
import { IRole } from "./roles.types.js";

const roleSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
    workspace_id: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
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

roleSchema.index({ name: 1, workspace_id: 1 }, { unique: true });

export const RoleModel = model<IRole>("Role", roleSchema);
