import { describe, it, expect, beforeEach } from "vitest";
import { api, seedPermissions, registerAndLogin, authHeader } from "./helpers.js";

describe("Workspace Member endpoints", () => {
  let adminToken: string;
  let memberToken: string;
  let memberId: string;
  let workspaceId: string;
  let memberRoleId: string;
  let managerRoleId: string;

  const memberBase = () => `/api/workspace-member/${workspaceId}`;

  beforeEach(async () => {
    await seedPermissions();

    ({ accessToken: adminToken } = await registerAndLogin("Admin", "admin@example.com"));
    const memberTokens = await registerAndLogin("Bob", "bob@example.com");
    memberToken = memberTokens.accessToken;

    // get bob's user id
    const profile = await api.get("/api/user/profile").set(authHeader(memberToken));
    memberId = profile.body.data._id;

    // admin creates workspace — becomes admin automatically
    const ws = await api.post("/api/workspace/create").set(authHeader(adminToken)).send({ name: "Test WS" });
    workspaceId = ws.body.data._id;

    // fetch roles seeded for this workspace
    const roles = await api.get(`/api/workspace/${workspaceId}/role`).set(authHeader(adminToken));
    memberRoleId = roles.body.data.find((r: any) => r.name === "member")._id;
    managerRoleId = roles.body.data.find((r: any) => r.name === "manager")._id;
  });

  describe("POST /create — add member", () => {
    it("admin can add a user as member (default role)", async () => {
      const res = await api
        .post(`${memberBase()}/create`)
        .set(authHeader(adminToken))
        .send({ userId: memberId });

      expect(res.status).toBe(201);
    });

    it("admin can add a user with an explicit role", async () => {
      const res = await api
        .post(`${memberBase()}/create`)
        .set(authHeader(adminToken))
        .send({ userId: memberId, roleId: managerRoleId });

      expect(res.status).toBe(201);
    });

    it("rejects adding the same user twice", async () => {
      await api.post(`${memberBase()}/create`).set(authHeader(adminToken)).send({ userId: memberId });
      const res = await api
        .post(`${memberBase()}/create`)
        .set(authHeader(adminToken))
        .send({ userId: memberId });

      expect(res.status).toBe(409);
    });

    it("rejects adding a non-existent user", async () => {
      const res = await api
        .post(`${memberBase()}/create`)
        .set(authHeader(adminToken))
        .send({ userId: "507f1f77bcf86cd799439011" });

      expect(res.status).toBe(404);
    });

    it("rejects when requester is not a workspace member", async () => {
      const outsiderTokens = await registerAndLogin("Outsider", "outsider@example.com");
      const res = await api
        .post(`${memberBase()}/create`)
        .set(authHeader(outsiderTokens.accessToken))
        .send({ userId: memberId });

      expect(res.status).toBe(403);
    });
  });

  describe("GET / — list members", () => {
    it("admin sees all subordinate members", async () => {
      await api.post(`${memberBase()}/create`).set(authHeader(adminToken)).send({ userId: memberId });

      const res = await api.get(`${memberBase()}/`).set(authHeader(adminToken));
      expect(res.status).toBe(200);
      expect(res.body.data.members.length).toBe(1);
    });

    it("member with no subordinates sees empty list", async () => {
      await api.post(`${memberBase()}/create`).set(authHeader(adminToken)).send({ userId: memberId });

      const res = await api.get(`${memberBase()}/`).set(authHeader(memberToken));
      expect(res.status).toBe(200);
      expect(res.body.data.members.length).toBe(0);
    });
  });

  describe("PATCH /update — update member role", () => {
    beforeEach(async () => {
      await api.post(`${memberBase()}/create`).set(authHeader(adminToken)).send({ userId: memberId });
    });

    it("admin can promote a member to manager", async () => {
      const res = await api
        .patch(`${memberBase()}/update`)
        .set(authHeader(adminToken))
        .send({ userId: memberId, roleId: managerRoleId });

      expect(res.status).toBe(200);
    });

    it("member cannot update another member's role", async () => {
      const thirdTokens = await registerAndLogin("Charlie", "charlie@example.com");
      const thirdProfile = await api.get("/api/user/profile").set(authHeader(thirdTokens.accessToken));
      const thirdId = thirdProfile.body.data._id;
      await api.post(`${memberBase()}/create`).set(authHeader(adminToken)).send({ userId: thirdId });

      const res = await api
        .patch(`${memberBase()}/update`)
        .set(authHeader(memberToken))
        .send({ userId: thirdId, roleId: memberRoleId });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /remove — remove member", () => {
    beforeEach(async () => {
      await api.post(`${memberBase()}/create`).set(authHeader(adminToken)).send({ userId: memberId });
    });

    it("admin can remove a member", async () => {
      const res = await api
        .delete(`${memberBase()}/remove`)
        .set(authHeader(adminToken))
        .send({ userId: memberId });

      expect(res.status).toBe(200);
    });

    it("rejects removing yourself", async () => {
      const adminProfile = await api.get("/api/user/profile").set(authHeader(adminToken));
      const adminId = adminProfile.body.data._id;

      const res = await api
        .delete(`${memberBase()}/remove`)
        .set(authHeader(adminToken))
        .send({ userId: adminId });

      expect(res.status).toBe(400);
    });

    it("member cannot remove another member", async () => {
      const thirdTokens = await registerAndLogin("Charlie", "charlie@example.com");
      const thirdProfile = await api.get("/api/user/profile").set(authHeader(thirdTokens.accessToken));
      const thirdId = thirdProfile.body.data._id;
      await api.post(`${memberBase()}/create`).set(authHeader(adminToken)).send({ userId: thirdId });

      const res = await api
        .delete(`${memberBase()}/remove`)
        .set(authHeader(memberToken))
        .send({ userId: thirdId });

      expect(res.status).toBe(403);
    });

    it("returns 404 for a user who is not a member", async () => {
      const outsiderTokens = await registerAndLogin("Ghost", "ghost@example.com");
      const ghostProfile = await api.get("/api/user/profile").set(authHeader(outsiderTokens.accessToken));

      const res = await api
        .delete(`${memberBase()}/remove`)
        .set(authHeader(adminToken))
        .send({ userId: ghostProfile.body.data._id });

      expect(res.status).toBe(404);
    });
  });
});
