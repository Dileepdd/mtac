import mongoose from "mongoose";
import { WorkspaceModel } from "./workspace.model.js";
import { RoleModel } from "../role/role.model.js";
import { WorkspaceMemberModel } from "../workspaceMember/workspaceMember.model.js";
import { PermissionModel } from "../permission/permission.model.js";
import { ROLE_CONFIG } from "../../config/roles.js";
import { IRole } from "../role/roles.types.js";

export const createWorkspace = async (userId: string, name: string) => {
  const workspace = await WorkspaceModel.create({ name, created_by: userId });
  const workspaceId = workspace._id;

  const permissions = await PermissionModel.find().select("_id name").lean();

  if (!permissions.length) {
    throw new Error("Permissions not seeded");
  }

  const permMap = new Map(permissions.map((p) => [p.name, p._id]));

  const createdRoles: IRole[] = [];

  for (const [roleName, roleData] of Object.entries(ROLE_CONFIG)) {
    let permissionIds;

    if (roleData.permissions === "ALL") {
      permissionIds = permissions.map((p) => p._id);
    } else {
      permissionIds = roleData.permissions.map((name) => {
        const id = permMap.get(name);
        if (!id) {
          throw new Error(`Permission not found: ${name}`);
        }
        return id;
      });
    }

    const [role] = await RoleModel.create([
      {
        name: roleName,
        level: roleData.level,
        workspace_id: workspaceId,
        created_by: userId,
        permissions: permissionIds,
      },
    ]);

    createdRoles.push(role);
  }

  const adminRole = createdRoles.find((r) => r.name === "admin");

  if (!adminRole) {
    throw new Error("Admin role not created");
  }

  await WorkspaceMemberModel.create({
    user_id: userId,
    workspace_id: workspaceId,
    role_id: adminRole._id,
    created_by: userId,
    updated_by: userId,
  });

  return {
    id: workspace._id,
    name: workspace.name,
  };
};

export const getWorkspace = async (workspaceId: string) => {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    throw new Error("Invalid workspace id");
  }

  const workspace = await WorkspaceModel.findById(workspaceId)
    .select("name created_by created_at")
    .lean();

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return workspace;
};
