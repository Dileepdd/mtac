import { UserModel } from "../user/user.model.js";
import { RegisterDTO, LogInDTO } from "./auth.validation.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import { getNextUserCode } from "../counter/counter.service.js";
import { AppError } from "../../errors/appError.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (data: RegisterDTO) => {
  const { name, email, password } = data;

  const existedUser = await UserModel.findOne({ email });

  if (existedUser) {
    throw new AppError("User already exists", 409, "USER_EXISTS");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user_code = await getNextUserCode();

  const user = await UserModel.create({
    name,
    email,
    password: hashedPassword,
    user_code,
  });

  logger.info("user.registered", { userId: user._id.toString() });
  return user;
};

export const loginUser = async (data: LogInDTO) => {
  const { email, password } = data;

  let user = await UserModel.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
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
