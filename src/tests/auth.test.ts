import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./helpers.js";

describe("POST /api/auth/register", () => {
  it("registers a new user", async () => {
    const res = await api.post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "Password1!",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("alice@example.com");
    expect(res.body.data.password).toBeUndefined();
  });

  it("rejects duplicate email", async () => {
    const payload = { name: "Alice", email: "alice@example.com", password: "Password1!" };
    await api.post("/api/auth/register").send(payload);
    const res = await api.post("/api/auth/register").send(payload);
    expect(res.status).toBe(409);
  });

  it("rejects weak password", async () => {
    const res = await api.post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "weak",
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await api.post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "Password1!",
    });
  });

  it("returns tokens on valid credentials", async () => {
    const res = await api.post("/api/auth/login").send({
      email: "alice@example.com",
      password: "Password1!",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it("rejects wrong password", async () => {
    const res = await api.post("/api/auth/login").send({
      email: "alice@example.com",
      password: "WrongPass1!",
    });
    expect(res.status).toBe(401);
  });

  it("rejects unknown email", async () => {
    const res = await api.post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "Password1!",
    });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/refresh", () => {
  it("returns a new access token given a valid refresh token", async () => {
    await api.post("/api/auth/register").send({ name: "Alice", email: "alice@example.com", password: "Password1!" });
    const login = await api.post("/api/auth/login").send({ email: "alice@example.com", password: "Password1!" });
    const { refreshToken } = login.body.data;

    const res = await api.post("/api/auth/refresh").send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it("rejects an invalid refresh token", async () => {
    const res = await api.post("/api/auth/refresh").send({ refreshToken: "bad.token.here" });
    expect(res.status).toBe(401);
  });

  it("rejects missing refresh token", async () => {
    const res = await api.post("/api/auth/refresh").send({});
    expect(res.status).toBe(400);
  });
});
