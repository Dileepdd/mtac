import { Types } from "mongoose";

export type TaskStatus   = "todo" | "in_progress" | "done";
export type TaskPriority = "urgent" | "high" | "med" | "low" | "none";

export interface ITask {
  key:          string;
  title:        string;
  description?: string;
  status:       TaskStatus;
  priority:     TaskPriority;
  labels:       string[];
  due?:         Date;
  project_id:   Types.ObjectId;
  workspace_id: Types.ObjectId;
  assigned_to?: Types.ObjectId;
  created_by:   Types.ObjectId;
  updated_by:   Types.ObjectId;
  created_at:   Date;
  updated_at:   Date;
}
