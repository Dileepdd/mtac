import { Schema, model } from "mongoose";
import { IInvitation } from "./invitation.types.js";

const invitationSchema = new Schema<IInvitation>(
  {
    token: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    workspace_id: { type: Schema.Types.ObjectId, required: true, ref: "Workspace", index: true },
    role_id: { type: Schema.Types.ObjectId, required: true, ref: "Role" },
    invited_by: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    status: {
      type: String,
      enum: ["pending", "accepted", "cancelled"],
      default: "pending",
    },
    expires_at: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

// TTL index — MongoDB auto-removes documents after expires_at
invitationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
invitationSchema.index({ workspace_id: 1, email: 1 });

export const InvitationModel = model<IInvitation>("Invitation", invitationSchema);
