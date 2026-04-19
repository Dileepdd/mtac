// config/env.ts
import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // ← move it here

export const env = {
  PORT: process.env.PORT || "3000",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  MONGO_CONNECTION_URL: process.env.MONGO_CONNECTION_URL as string,
};
