import mongoose from "mongoose";
import { RoleModel } from "./role.model.js";
import { PermissionModel } from "../permission/permission.model.js";
import { AppError } from "../../errors/appError.js";
import { logger } from "../../utils/logger.js";

export const getRoles = async (workspaceId: string) => {
  const roles = await RoleModel.find({ workspace_id: workspaceId })
    .select("name level permissions")
    .populate<{ permissions: { _id: string; name: string }[] }>({ path: "permissions", select: "name" })
    .sort({ level: 1 })
    .lean();

  return roles;
};

export const updateRolePermissions = async ({
  roleId,
  workspaceId,
  permissionNames,
  userId,
}: {
  roleId: string;
  workspaceId: string;
  permissionNames: string[];
  userId: string;
}) => {
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    throw new AppError("Invalid role id", 400, "INVALID_ID");
  }

  const role = await RoleModel.findOne({ _id: roleId, workspace_id: workspaceId }).lean();
  if (!role) throw new AppError("Role not found", 404, "NOT_FOUND");

  const permissions = await PermissionModel.find({ name: { $in: permissionNames } })
    .select("_id name")
    .lean();

  const foundNames = permissions.map((p) => p.name);
  const invalid = permissionNames.filter((n) => !foundNames.includes(n));
  if (invalid.length) {
    throw new AppError(`Invalid permissions: ${invalid.join(", ")}`, 400, "INVALID_PERMISSIONS");
  }

  const updated = await RoleModel.findByIdAndUpdate(
    roleId,
    { permissions: permissions.map((p) => p._id) },
    { returnDocument: "after" }
  )
    .select("name level permissions")
    .populate<{ permissions: { _id: string; name: string }[] }>({ path: "permissions", select: "name" })
    .lean();

  logger.info("role.permissions_updated", { roleId, workspaceId, userId });
  return updated;
};
