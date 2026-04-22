import { UserModel } from "./user.model.js";
import { AppError } from "../../errors/appError.js";
import { logger } from "../../utils/logger.js";
import bcrypt from "bcrypt";

export const getUserProfile = async (userId: string) => {
  const user = await UserModel.findById(userId)
    .select("name email user_code created_at")
    .lean();

  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  return user;
};

export const updateUserProfile = async (userId: string, name: string) => {
  const user = await UserModel.findByIdAndUpdate(userId, { name }, { returnDocument: "after" })
    .select("name email user_code created_at updated_at")
    .lean();

  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  logger.info("user.profile_updated", { userId });
  return user;
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await UserModel.findById(userId).select("+password").lean();
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError("Current password is incorrect", 401, "INVALID_CREDENTIALS");

  const hashed = await bcrypt.hash(newPassword, 10);
  await UserModel.findByIdAndUpdate(userId, { password: hashed });

  logger.info("user.password_changed", { userId });
};
