import { Types } from "mongoose";

export interface IProject {
  name:         string;
  key:          string;
  color:        string;
  workspace_id: Types.ObjectId;
  created_by:   Types.ObjectId;
  created_at:   Date;
  updated_at:   Date;
}
