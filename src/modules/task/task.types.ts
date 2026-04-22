import { Types } from "mongoose";

export type TaskStatus = "todo" | "in_progress" | "done";

export interface ITask {
  title: string;
  description?: string;
  project_id: Types.ObjectId;
  workspace_id: Types.ObjectId;
  assigned_to?: Types.ObjectId;
  status: TaskStatus;
  created_by: Types.ObjectId;
  updated_by: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}
