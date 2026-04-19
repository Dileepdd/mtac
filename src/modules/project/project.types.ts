import { Types, Document } from "mongoose";

export interface IProject {
  name: string;
  workspace_id: Types.ObjectId;
  created_by: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}
