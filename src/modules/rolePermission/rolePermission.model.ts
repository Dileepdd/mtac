import { Schema, model } from "mongoose";
import { IRolePermissions } from "./rolePermission.types.js";

const rolePermissionsSchema = new Schema<IRolePermissions>(
  {
    role_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Role",
      index: true,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Permission",
      },
    ],
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

export const RolePermissionsModel = model<IRolePermissions>(
  "RolePermissions",
  rolePermissionsSchema
);
