import { Types } from "mongoose";

export type InvitationStatus = "pending" | "accepted" | "cancelled";

export interface IInvitation {
  token: string;
  email: string;
  workspace_id: Types.ObjectId;
  role_id: Types.ObjectId;
  invited_by: Types.ObjectId;
  status: InvitationStatus;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}
