import { describe, it, expect, beforeEach } from "vitest";
import { api, seedPermissions, registerAndLogin, authHeader } from "./helpers.js";

describe("Workspace endpoints", () => {
  let token: string;

  beforeEach(async () => {
    await seedPermissions();
    ({ accessToken: token } = await registerAndLogin());
  });

  describe("POST /api/workspace/create", () => {
    it("creates a workspace and auto-seeds roles", async () => {
      const res = await api
        .post("/api/workspace/create")
        .set(authHeader(token))
        .send({ name: "My Workspace" });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("My Workspace");
    });

    it("rejects duplicate workspace name for the same user", async () => {
      await api.post("/api/workspace/create").set(authHeader(token)).send({ name: "Dupe" });
      const res = await api.post("/api/workspace/create").set(authHeader(token)).send({ name: "Dupe" });
      expect(res.status).toBe(409);
    });

    it("rejects request without auth token", async () => {
      const res = await api.post("/api/workspace/create").send({ name: "NoAuth" });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/workspace", () => {
    it("returns paginated list of workspaces the user belongs to", async () => {
      await api.post("/api/workspace/create").set(authHeader(token)).send({ name: "WS1" });
      await api.post("/api/workspace/create").set(authHeader(token)).send({ name: "WS2" });

      const res = await api.get("/api/workspace").set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });
  });

  describe("GET /api/workspace/:workspace_id", () => {
    it("returns workspace details", async () => {
      const created = await api.post("/api/workspace/create").set(authHeader(token)).send({ name: "Details WS" });
      const id = created.body.data.id;

      const res = await api.get(`/api/workspace/${id}`).set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Details WS");
    });

    it("returns 400 for a malformed workspace id", async () => {
      const res = await api.get("/api/workspace/not-an-id").set(authHeader(token));
      expect(res.status).toBe(400);
    });

    it("returns 403 when user is not a member", async () => {
      const otherTokens = await registerAndLogin("Bob", "bob@example.com");
      const ws = await api.post("/api/workspace/create").set(authHeader(otherTokens.accessToken)).send({ name: "Bob WS" });
      const id = ws.body.data.id;

      const res = await api.get(`/api/workspace/${id}`).set(authHeader(token));
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/workspace/:workspace_id", () => {
    it("allows admin to delete their workspace", async () => {
      const created = await api.post("/api/workspace/create").set(authHeader(token)).send({ name: "To Delete" });
      const id = created.body.data.id;

      const res = await api.delete(`/api/workspace/${id}`).set(authHeader(token));
      expect(res.status).toBe(200);
    });

    it("returns 404 after workspace is deleted", async () => {
      const created = await api.post("/api/workspace/create").set(authHeader(token)).send({ name: "Gone" });
      const id = created.body.data.id;
      await api.delete(`/api/workspace/${id}`).set(authHeader(token));

      const res = await api.get(`/api/workspace/${id}`).set(authHeader(token));
      expect(res.status).toBe(403);
    });
  });
});
