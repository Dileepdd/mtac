// config/env.ts
import dotenv from "dotenv";
import { z } from "zod";
dotenv.config({ path: "./.env" });

const envSchema = z.object({
  PORT: z.string().default("3000"),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  MONGO_CONNECTION_URL: z.string().min(1, "MONGO_CONNECTION_URL is required"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),
  REDIS_REST_URL: z.string().min(1, "REDIS_REST_URL is required"),
  REDIS_REST_TOKEN: z.string().min(1, "REDIS_REST_TOKEN is required"),
});

export const env = envSchema.parse(process.env);
