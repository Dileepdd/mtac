import { Schema, model } from "mongoose";
import { IUser } from "./user.types.js";

const userSchema = new Schema<IUser>(
  {
    name:      { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true, select: false },
    user_code: { type: String, unique: true, index: true },
    hue:       { type: Number, default: () => Math.floor(Math.random() * 360) },
    email_verified:        { type: Boolean, default: false },
    email_otp:             { type: String, select: false },
    email_otp_expires_at:  { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

export const UserModel = model<IUser>("User", userSchema);
