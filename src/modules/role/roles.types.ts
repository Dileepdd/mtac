import { Types, Document } from "mongoose";

export interface IRole extends Document {
  name: string;
  level: number;
  workspace_id: Types.ObjectId;
  created_by: Types.ObjectId;
  permissions: Types.ObjectId[];
  created_at: Date;
  updated_at: Date;
}
