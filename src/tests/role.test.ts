import { describe, it, expect, beforeEach } from "vitest";
import { api, seedPermissions, registerAndLogin, authHeader } from "./helpers.js";

describe("Role management endpoints", () => {
  let adminToken: string;
  let memberToken: string;
  let workspaceId: string;
  let memberRoleId: string;

  beforeEach(async () => {
    await seedPermissions();

    ({ accessToken: adminToken } = await registerAndLogin("Admin", "admin@example.com"));

    const ws = await api.post("/api/workspace/create").set(authHeader(adminToken)).send({ name: "Test WS" });
    workspaceId = ws.body.data._id;

    // register a regular member and add them to the workspace
    const memberTokens = await registerAndLogin("Bob", "bob@example.com");
    memberToken = memberTokens.accessToken;
    const profile = await api.get("/api/user/profile").set(authHeader(memberToken));
    const memberId = profile.body.data._id;
    await api.post(`/api/workspace-member/${workspaceId}/create`).set(authHeader(adminToken)).send({ userId: memberId });

    const roles = await api.get(`/api/workspace/${workspaceId}/role`).set(authHeader(adminToken));
    memberRoleId = roles.body.data.find((r: any) => r.name === "member")._id;
  });

  describe("GET /api/workspace/:workspace_id/role", () => {
    it("returns all 3 seeded roles sorted by level", async () => {
      const res = await api.get(`/api/workspace/${workspaceId}/role`).set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data.map((r: any) => r.name)).toEqual(
        expect.arrayContaining(["admin", "manager", "member"])
      );
      // sorted ascending by level
      const levels = res.body.data.map((r: any) => r.level);
      expect(levels).toEqual([...levels].sort((a, b) => a - b));
    });

    it("any workspace member can list roles", async () => {
      const res = await api.get(`/api/workspace/${workspaceId}/role`).set(authHeader(memberToken));
      expect(res.status).toBe(200);
    });

    it("non-member cannot list roles", async () => {
      const outsiderTokens = await registerAndLogin("Outsider", "outsider@example.com");
      const res = await api.get(`/api/workspace/${workspaceId}/role`).set(authHeader(outsiderTokens.accessToken));
      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/workspace/:workspace_id/role/:role_id/permissions", () => {
    it("admin can update role permissions", async () => {
      const res = await api
        .patch(`/api/workspace/${workspaceId}/role/${memberRoleId}/permissions`)
        .set(authHeader(adminToken))
        .send({ permissions: ["VIEW_WORKSPACE", "VIEW_PROJECT", "VIEW_TASK", "CREATE_TASK"] });

      expect(res.status).toBe(200);
      const permNames = res.body.data.permissions.map((p: any) => p.name);
      expect(permNames).toContain("CREATE_TASK");
    });

    it("rejects invalid permission names", async () => {
      const res = await api
        .patch(`/api/workspace/${workspaceId}/role/${memberRoleId}/permissions`)
        .set(authHeader(adminToken))
        .send({ permissions: ["FAKE_PERM", "ANOTHER_FAKE"] });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_PERMISSIONS");
    });

    it("rejects empty permissions array", async () => {
      const res = await api
        .patch(`/api/workspace/${workspaceId}/role/${memberRoleId}/permissions`)
        .set(authHeader(adminToken))
        .send({ permissions: [] });

      expect(res.status).toBe(400);
    });

    it("member without CHANGE_ROLE permission is denied", async () => {
      const res = await api
        .patch(`/api/workspace/${workspaceId}/role/${memberRoleId}/permissions`)
        .set(authHeader(memberToken))
        .send({ permissions: ["VIEW_WORKSPACE"] });

      expect(res.status).toBe(403);
    });

    it("returns 404 for a role that does not belong to the workspace", async () => {
      const res = await api
        .patch(`/api/workspace/${workspaceId}/role/507f1f77bcf86cd799439011/permissions`)
        .set(authHeader(adminToken))
        .send({ permissions: ["VIEW_WORKSPACE"] });

      expect(res.status).toBe(404);
    });
  });
});
