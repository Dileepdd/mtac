import { Types, Document } from "mongoose";

export interface IRolePermissions extends Document {
  role_id: Types.ObjectId;
  permissions: Types.ObjectId[];
  created_by: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}
