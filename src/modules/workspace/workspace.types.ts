import { Types, Document } from "mongoose";

export interface IWorkspace extends Document {
  name: string;
  created_by: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}
