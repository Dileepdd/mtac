import { Schema, model } from "mongoose";
import { IUser } from "./user.types.js";

const userSchema = new Schema<IUser>(
  {
    name:      { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: false, select: false },
    provider:  { type: String, enum: ["local", "google"], default: "local" },
    googleId:  { type: String, select: false, sparse: true, unique: true },
    user_code: { type: String, unique: true, index: true },
    hue:       { type: Number, default: () => Math.floor(Math.random() * 360) },
    avatar:    { type: String },
    notification_prefs: {
      assigned: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      status:   { type: Boolean, default: false },
      weekly:   { type: Boolean, default: true },
    },
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
