import { Document, Types } from "mongoose";

export interface IWorkspaceMember extends Document {
  user_id: Types.ObjectId;
  role_id: Types.ObjectId;
  workspace_id: Types.ObjectId;
  created_by: Types.ObjectId;
  updated_by: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}
