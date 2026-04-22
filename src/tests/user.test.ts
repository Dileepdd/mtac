import { describe, it, expect, beforeEach } from "vitest";
import { api, registerAndLogin, authHeader } from "./helpers.js";

describe("User endpoints", () => {
  let token: string;

  beforeEach(async () => {
    ({ accessToken: token } = await registerAndLogin("Alice", "alice@example.com", "Password1!"));
  });

  describe("GET /api/user/profile", () => {
    it("returns the authenticated user's profile", async () => {
      const res = await api.get("/api/user/profile").set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Alice");
      expect(res.body.data.email).toBe("alice@example.com");
      expect(res.body.data.password).toBeUndefined();
    });

    it("returns 401 without a token", async () => {
      const res = await api.get("/api/user/profile");
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/user/profile", () => {
    it("updates the user's name", async () => {
      const res = await api
        .patch("/api/user/profile")
        .set(authHeader(token))
        .send({ name: "Alice Updated" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Alice Updated");
    });

    it("rejects name shorter than 3 characters", async () => {
      const res = await api
        .patch("/api/user/profile")
        .set(authHeader(token))
        .send({ name: "Al" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("persists the name change on subsequent profile fetch", async () => {
      await api.patch("/api/user/profile").set(authHeader(token)).send({ name: "Persisted Name" });
      const res = await api.get("/api/user/profile").set(authHeader(token));

      expect(res.body.data.name).toBe("Persisted Name");
    });
  });

  describe("PATCH /api/user/password", () => {
    it("changes password with correct current password", async () => {
      const res = await api
        .patch("/api/user/password")
        .set(authHeader(token))
        .send({ currentPassword: "Password1!", newPassword: "NewPass2@" });

      expect(res.status).toBe(200);
    });

    it("can login with the new password after change", async () => {
      await api
        .patch("/api/user/password")
        .set(authHeader(token))
        .send({ currentPassword: "Password1!", newPassword: "NewPass2@" });

      const res = await api.post("/api/auth/login").send({ email: "alice@example.com", password: "NewPass2@" });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it("cannot login with old password after change", async () => {
      await api
        .patch("/api/user/password")
        .set(authHeader(token))
        .send({ currentPassword: "Password1!", newPassword: "NewPass2@" });

      const res = await api.post("/api/auth/login").send({ email: "alice@example.com", password: "Password1!" });
      expect(res.status).toBe(401);
    });

    it("rejects incorrect current password", async () => {
      const res = await api
        .patch("/api/user/password")
        .set(authHeader(token))
        .send({ currentPassword: "WrongPass1!", newPassword: "NewPass2@" });

      expect(res.status).toBe(401);
    });

    it("rejects a weak new password", async () => {
      const res = await api
        .patch("/api/user/password")
        .set(authHeader(token))
        .send({ currentPassword: "Password1!", newPassword: "weak" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });
});
