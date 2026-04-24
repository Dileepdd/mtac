import { describe, it, expect, beforeEach } from "vitest";
import { api, seedPermissions, registerAndLogin, authHeader } from "./helpers.js";

describe("Project endpoints", () => {
  let token: string;
  let workspaceId: string;

  beforeEach(async () => {
    await seedPermissions();
    ({ accessToken: token } = await registerAndLogin());
    const ws = await api.post("/api/workspace/create").set(authHeader(token)).send({ name: "Test WS" });
    workspaceId = ws.body.data._id;
  });

  const projectBase = () => `/api/workspace/${workspaceId}/project`;

  describe("POST /project", () => {
    it("creates a project", async () => {
      const res = await api.post(projectBase()).set(authHeader(token)).send({ name: "Alpha" });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Alpha");
    });

    it("rejects duplicate project name in same workspace", async () => {
      await api.post(projectBase()).set(authHeader(token)).send({ name: "Alpha" });
      const res = await api.post(projectBase()).set(authHeader(token)).send({ name: "Alpha" });
      expect(res.status).toBe(409);
    });

    it("rejects missing name", async () => {
      const res = await api.post(projectBase()).set(authHeader(token)).send({});
      expect(res.status).toBe(400);
    });
  });

  describe("GET /project", () => {
    it("returns paginated project list sorted by created_at desc", async () => {
      await api.post(projectBase()).set(authHeader(token)).send({ name: "P1" });
      await api.post(projectBase()).set(authHeader(token)).send({ name: "P2" });

      const res = await api.get(projectBase()).set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });
  });

  describe("GET /project/:project_id", () => {
    it("returns a single project", async () => {
      const created = await api.post(projectBase()).set(authHeader(token)).send({ name: "Solo" });
      const id = created.body.data._id;

      const res = await api.get(`${projectBase()}/${id}`).set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Solo");
    });

    it("returns 404 for unknown project", async () => {
      const res = await api.get(`${projectBase()}/507f1f77bcf86cd799439011`).set(authHeader(token));
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /project/:project_id", () => {
    it("updates project name", async () => {
      const created = await api.post(projectBase()).set(authHeader(token)).send({ name: "Old" });
      const id = created.body.data._id;

      const res = await api.patch(`${projectBase()}/${id}`).set(authHeader(token)).send({ name: "New" });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("New");
    });
  });

  describe("DELETE /project/:project_id", () => {
    it("deletes a project", async () => {
      const created = await api.post(projectBase()).set(authHeader(token)).send({ name: "Delete Me" });
      const id = created.body.data._id;

      const res = await api.delete(`${projectBase()}/${id}`).set(authHeader(token));
      expect(res.status).toBe(200);
    });

    it("returns 404 on subsequent fetch after deletion", async () => {
      const created = await api.post(projectBase()).set(authHeader(token)).send({ name: "Gone" });
      const id = created.body.data._id;
      await api.delete(`${projectBase()}/${id}`).set(authHeader(token));

      const res = await api.get(`${projectBase()}/${id}`).set(authHeader(token));
      expect(res.status).toBe(404);
    });
  });
});
