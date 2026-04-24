import { describe, it, expect, beforeEach } from "vitest";
import { api, seedPermissions, registerAndLogin, authHeader } from "./helpers.js";

describe("Task endpoints", () => {
  let token: string;
  let workspaceId: string;
  let projectId: string;

  beforeEach(async () => {
    await seedPermissions();
    ({ accessToken: token } = await registerAndLogin());

    const ws = await api.post("/api/workspace/create").set(authHeader(token)).send({ name: "Test WS" });
    workspaceId = ws.body.data._id;

    const proj = await api
      .post(`/api/workspace/${workspaceId}/project`)
      .set(authHeader(token))
      .send({ name: "Test Project" });
    projectId = proj.body.data._id;
  });

  const taskBase = () => `/api/workspace/${workspaceId}/project/${projectId}/task`;

  describe("POST /task", () => {
    it("creates a task with status todo by default", async () => {
      const res = await api.post(taskBase()).set(authHeader(token)).send({ title: "Fix bug" });
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Fix bug");
      expect(res.body.data.status).toBe("todo");
    });

    it("rejects missing title", async () => {
      const res = await api.post(taskBase()).set(authHeader(token)).send({});
      expect(res.status).toBe(400);
    });

    it("rejects invalid project id", async () => {
      const res = await api
        .post(`/api/workspace/${workspaceId}/project/bad-id/task`)
        .set(authHeader(token))
        .send({ title: "Oops" });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /task", () => {
    it("returns paginated tasks sorted by created_at desc", async () => {
      await api.post(taskBase()).set(authHeader(token)).send({ title: "T1" });
      await api.post(taskBase()).set(authHeader(token)).send({ title: "T2" });

      const res = await api.get(taskBase()).set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });
  });

  describe("PATCH /task/:task_id", () => {
    it("updates status and title", async () => {
      const created = await api.post(taskBase()).set(authHeader(token)).send({ title: "Draft" });
      const id = created.body.data._id;

      const res = await api
        .patch(`${taskBase()}/${id}`)
        .set(authHeader(token))
        .send({ title: "Done Task", status: "done" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("done");
      expect(res.body.data.title).toBe("Done Task");
    });

    it("rejects invalid status value", async () => {
      const created = await api.post(taskBase()).set(authHeader(token)).send({ title: "Draft" });
      const id = created.body.data._id;

      const res = await api
        .patch(`${taskBase()}/${id}`)
        .set(authHeader(token))
        .send({ status: "flying" });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /task/:task_id", () => {
    it("deletes a task", async () => {
      const created = await api.post(taskBase()).set(authHeader(token)).send({ title: "Bye" });
      const id = created.body.data._id;

      const res = await api.delete(`${taskBase()}/${id}`).set(authHeader(token));
      expect(res.status).toBe(200);
    });

    it("returns 404 on subsequent fetch", async () => {
      const created = await api.post(taskBase()).set(authHeader(token)).send({ title: "Gone" });
      const id = created.body.data._id;
      await api.delete(`${taskBase()}/${id}`).set(authHeader(token));

      const res = await api.get(`${taskBase()}/${id}`).set(authHeader(token));
      expect(res.status).toBe(404);
    });
  });
});
