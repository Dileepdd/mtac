import { Types, Document } from "mongoose";

export interface WorkspaceSettings {
  accent?:      string;
  font?:        "geist" | "plex" | "system";
  density?:     "compact" | "comfortable" | "spacious";
  timezone?:    string;
  date_format?: string;
  language?:    string;
}

export interface IWorkspace extends Document {
  name:       string;
  slug:       string;
  settings:   WorkspaceSettings;
  created_by: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}
