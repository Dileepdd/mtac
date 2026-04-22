import { Schema, model } from "mongoose";
import { IPermission } from "./permission.types.js";

const permissionsSchema = new Schema<IPermission>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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

export const PermissionModel = model<IPermission>(
  "Permission",
  permissionsSchema
);
