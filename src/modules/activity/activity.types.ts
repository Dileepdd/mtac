import { Types } from "mongoose";

export type ActivityVerb =
  | "created"
  | "moved"
  | "assigned"
  | "commented"
  | "completed"
  | "added"
  | "removed";

export type ActivityTargetType = "task" | "project" | "member";

export interface IActivity {
  workspace_id: Types.ObjectId;
  actor_id:     Types.ObjectId;
  actor_name:   string;
  verb:         ActivityVerb;
  target:       string;         // e.g. "LAU-21", "Q4 Launch"
  target_type:  ActivityTargetType;
  to?:          string;         // e.g. "In Progress" for move events
  created_at:   Date;
}
