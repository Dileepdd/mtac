import { Types } from "mongoose";

export interface IComment {
  body:         string;
  author_id:    Types.ObjectId;
  task_id:      Types.ObjectId;
  project_id:   Types.ObjectId;
  workspace_id: Types.ObjectId;
  created_at:   Date;
  updated_at:   Date;
}
