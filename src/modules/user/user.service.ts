import { UserModel } from "./user.model.js";
import { WorkspaceMemberModel } from "../workspaceMember/workspaceMember.model.js";
import { AppError } from "../../errors/appError.js";
import { logger } from "../../utils/logger.js";
import bcrypt from "bcrypt";
import type { INotificationPrefs } from "./user.types.js";

export const getUserProfile = async (userId: string) => {
  const user = await UserModel.findById(userId)
    .select("name email user_code hue avatar notification_prefs created_at")
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

  if (!user.password) {
    throw new AppError(
      "This account uses Google Sign-In and has no password to change.",
      400,
      "USE_GOOGLE_SIGN_IN"
    );
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError("Current password is incorrect", 401, "INVALID_CREDENTIALS");

  const hashed = await bcrypt.hash(newPassword, 10);
  await UserModel.findByIdAndUpdate(userId, { password: hashed });

  logger.info("user.password_changed", { userId });
};

export const updatePreferences = async (userId: string, prefs: Partial<INotificationPrefs>) => {
  const update: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(prefs)) {
    if (typeof v === "boolean") update[`notification_prefs.${k}`] = v;
  }

  const user = await UserModel
    .findByIdAndUpdate(userId, update, { returnDocument: "after" })
    .select("notification_prefs")
    .lean();

  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  logger.info("user.preferences_updated", { userId });
  return user.notification_prefs;
};

export const updateAvatar = async (userId: string, avatar: string) => {
  const user = await UserModel
    .findByIdAndUpdate(userId, { avatar }, { returnDocument: "after" })
    .select("name email user_code hue avatar created_at notification_prefs")
    .lean();

  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  logger.info("user.avatar_updated", { userId });
  return user;
};

export const deleteAccount = async (userId: string) => {
  const user = await UserModel.findByIdAndDelete(userId).lean();
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  await WorkspaceMemberModel.deleteMany({ user_id: userId });

  logger.info("user.account_deleted", { userId });
};
