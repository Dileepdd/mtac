import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_CONNECTION_URL);
    console.log(`MongoDB connected : ${conn.connection.host}`);
  } catch (error) {
    console.error("DB connection failed:", error);
    process.exit(1);
  }
};
