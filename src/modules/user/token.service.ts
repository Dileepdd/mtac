import crypto from "crypto";
import bcrypt from "bcrypt";
import { TokenModel } from "./token.model.js";
import { AppError } from "../../errors/appError.js";
import { logger } from "../../utils/logger.js";

export async function listTokens(userId: string) {
  return TokenModel
    .find({ user_id: userId })
    .select("name prefix last_used_at created_at")
    .sort({ created_at: -1 })
    .lean();
}

export async function createToken(userId: string, name: string) {
  const raw    = "mtac_" + crypto.randomBytes(24).toString("hex");
  const prefix = raw.slice(0, 16) + "…";
  const hash   = await bcrypt.hash(raw, 10);
  const doc    = await TokenModel.create({ user_id: userId, name, prefix, hash });

  logger.info("token.created", { userId, tokenId: doc._id });
  return { _id: String(doc._id), token: raw, prefix, name, created_at: doc.created_at };
}

export async function revokeToken(userId: string, tokenId: string) {
  const result = await TokenModel.deleteOne({ _id: tokenId, user_id: userId });
  if (!result.deletedCount) throw new AppError("Token not found", 404, "NOT_FOUND");
  logger.info("token.revoked", { userId, tokenId });
}
