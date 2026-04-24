import { Schema, model, Types } from "mongoose";

export interface IToken {
  user_id:       Types.ObjectId;
  name:          string;
  prefix:        string;
  hash:          string;
  last_used_at?: Date;
  created_at:    Date;
}

const tokenSchema = new Schema<IToken>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    name:    { type: String, required: true, trim: true },
    prefix:  { type: String, required: true },
    hash:    { type: String, required: true, select: false },
    last_used_at: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    versionKey: false,
  }
);

export const TokenModel = model<IToken>("Token", tokenSchema);
