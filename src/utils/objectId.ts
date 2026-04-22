import mongoose from "mongoose";
import { AppError } from "../errors/appError.js";

export const validateObjectId = (id: string, label = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}`, 400, "INVALID_ID");
  }
};
