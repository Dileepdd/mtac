import request from "supertest";
import app from "../app.js";
import { PermissionModel } from "../modules/permission/permission.model.js";
import { DEFAULT_PERMISSIONS } from "../config/permissions.js";

export const api = request(app);

export const seedPermissions = async () => {
  await PermissionModel.insertMany(DEFAULT_PERMISSIONS);
};

export const registerAndLogin = async (
  name = "Test User",
  email = "test@example.com",
  password = "Password1!"
) => {
  await api.post("/api/auth/register").send({ name, email, password });
  const res = await api.post("/api/auth/login").send({ email, password });
  return res.body.data as { accessToken: string; refreshToken: string };
};

export const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });
