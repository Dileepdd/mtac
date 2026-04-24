import { randomUUID } from "crypto";
import { UserModel } from "../user/user.model.js";
import { PasswordResetTokenModel } from "./passwordReset.model.js";
import { RegisterDTO, LogInDTO, ForgotPasswordDTO, ResetPasswordDTO } from "./auth.validation.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import { getNextUserCode } from "../counter/counter.service.js";
import { AppError } from "../../errors/appError.js";
import { sendForgotPasswordEmail, sendVerificationEmail } from "../notification/notification.service.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const registerUser = async (data: RegisterDTO) => {
  const { name, email, password } = data;

  const existedUser = await UserModel.findOne({ email });

  if (existedUser) {
    if (!existedUser.email_verified) {
      const otp = generateOtp();
      const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
      await UserModel.findByIdAndUpdate(existedUser._id, { email_otp: otp, email_otp_expires_at: otpExpiresAt });
      logger.info("user.re_registration.otp_resend_attempt", { email, userId: existedUser._id.toString() });
      try {
        await sendVerificationEmail(email, existedUser.name, otp);
        logger.info("user.re_registration.otp_sent", { email });
      } catch (err) {
        logger.error("user.re_registration.otp_failed", { email, error: err instanceof Error ? err.message : String(err) });
        throw new AppError("Failed to send verification email. Please try again.", 503, "EMAIL_SEND_FAILED");
      }
      throw new AppError("Account already exists but is not verified. A new code has been sent to your email.", 409, "EMAIL_NOT_VERIFIED");
    }
    throw new AppError("User already exists", 409, "USER_EXISTS");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user_code = await getNextUserCode();
  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

  const user = await UserModel.create({
    name,
    email,
    password: hashedPassword,
    user_code,
    email_verified: false,
    email_otp: otp,
    email_otp_expires_at: otpExpiresAt,
  });

  try {
    await sendVerificationEmail(email, name, otp);
  } catch {
    await UserModel.findByIdAndDelete(user._id);
    throw new AppError("Failed to send verification email. Please try again.", 503, "EMAIL_SEND_FAILED");
  }

  logger.info("user.registered", { userId: user._id.toString() });
  return user;
};

export const loginUser = async (data: LogInDTO) => {
  const { email, password } = data;

  let user = await UserModel.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  if (!user.password) {
    throw new AppError(
      "This account uses Google Sign-In. Please sign in with Google.",
      400,
      "USE_GOOGLE_SIGN_IN"
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  // Only block users explicitly marked unverified (=== false).
  // Existing users who predate this field (undefined) are treated as verified.
  if (user.email_verified === false) {
    throw new AppError("Please verify your email before signing in.", 403, "EMAIL_NOT_VERIFIED");
  }

  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());
  logger.info("user.login", { userId: user._id.toString() });
  return { accessToken, refreshToken };
};

export const refreshAccessToken = (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
    const accessToken = generateAccessToken(decoded.userId);
    return { accessToken };
  } catch {
    throw new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");
  }
};

export const verifyEmail = async (email: string, otp: string): Promise<void> => {
  const user = await UserModel.findOne({ email }).select("+email_otp +email_otp_expires_at");

  if (!user) throw new AppError("Invalid verification code.", 400, "INVALID_OTP");
  if (user.email_verified) throw new AppError("This email is already verified.", 400, "ALREADY_VERIFIED");
  if (!user.email_otp || user.email_otp !== otp) throw new AppError("Invalid verification code.", 400, "INVALID_OTP");
  if (!user.email_otp_expires_at || user.email_otp_expires_at < new Date()) {
    throw new AppError("This code has expired. Request a new one.", 400, "OTP_EXPIRED");
  }

  await UserModel.findByIdAndUpdate(user._id, {
    email_verified: true,
    $unset: { email_otp: 1, email_otp_expires_at: 1 },
  });

  logger.info("user.email_verified", { userId: user._id.toString() });
};

export const resendOtp = async (email: string): Promise<void> => {
  const user = await UserModel.findOne({ email });

  if (!user) return; // Don't reveal whether email exists
  if (user.email_verified) throw new AppError("This email is already verified.", 400, "ALREADY_VERIFIED");

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

  await UserModel.findByIdAndUpdate(user._id, {
    email_otp: otp,
    email_otp_expires_at: otpExpiresAt,
  });

  try {
    await sendVerificationEmail(email, user.name, otp);
  } catch {
    throw new AppError("Failed to send verification email. Please try again.", 503, "EMAIL_SEND_FAILED");
  }
  logger.info("user.otp_resent", { userId: user._id.toString() });
};

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export const requestPasswordReset = async ({ email }: ForgotPasswordDTO): Promise<void> => {
  const user = await UserModel.findOne({ email }).select("_id name email").lean();

  // Always return without error — prevents email enumeration
  if (!user) return;

  // Invalidate any existing reset tokens for this user
  await PasswordResetTokenModel.deleteMany({ user_id: user._id });

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await PasswordResetTokenModel.create({ token, user_id: user._id, expires_at: expiresAt });

  const resetLink = `${env.APP_URL}/reset-password/${token}`;

  try {
    await sendForgotPasswordEmail(email, user.name, resetLink);
  } catch {
    throw new AppError("Failed to send password reset email. Please try again.", 503, "EMAIL_SEND_FAILED");
  }

  logger.info("auth.password_reset_requested", { userId: user._id.toString() });
};

export const resetPassword = async (token: string, { newPassword }: ResetPasswordDTO): Promise<void> => {
  const record = await PasswordResetTokenModel.findOne({ token });

  if (!record) throw new AppError("Invalid or expired reset link", 400, "INVALID_RESET_TOKEN");
  if (record.used) throw new AppError("This reset link has already been used", 400, "RESET_TOKEN_USED");
  if (record.expires_at < new Date()) throw new AppError("This reset link has expired", 400, "RESET_TOKEN_EXPIRED");

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await Promise.all([
    UserModel.findByIdAndUpdate(record.user_id, { password: hashedPassword }),
    PasswordResetTokenModel.findByIdAndUpdate(record._id, { used: true }),
  ]);

  logger.info("auth.password_reset_completed", { userId: record.user_id.toString() });
};
