import { Schema, model, Document } from "mongoose";
import { ICounter } from "./counter.types.js";

const counterSchema = new Schema<ICounter>({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  value: {
    type: Number,
    default: 0,
  },
});

export const Counter = model<ICounter>("Counter", counterSchema);
