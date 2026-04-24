import { Schema, model, Types } from "mongoose";

interface IPasswordResetToken {
  token: string;
  user_id: Types.ObjectId;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

const passwordResetSchema = new Schema<IPasswordResetToken>(
  {
    token:      { type: String, required: true, unique: true, index: true },
    user_id:    { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    expires_at: { type: Date, required: true },
    used:       { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    versionKey: false,
  }
);

// TTL index — MongoDB auto-removes expired documents
passwordResetSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetTokenModel = model<IPasswordResetToken>(
  "PasswordResetToken",
  passwordResetSchema
);
