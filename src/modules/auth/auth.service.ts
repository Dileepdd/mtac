import { UserModel } from "../user/user.model.js";
import { RegisterDTO, LogInDTO } from "./auth.validation.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import { getNextUserCode } from "../counter/counter.service.js";
import bcrypt from "bcrypt";

export const registerUser = async (data: RegisterDTO) => {
  const { name, email, password } = data;

  const existedUser = await UserModel.findOne({ email });

  if (existedUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user_code = await getNextUserCode();

  const user = await UserModel.create({
    name,
    email,
    password: hashedPassword,
    user_code,
  });

  return user;
};

export const loginUser = async (data: LogInDTO) => {
  const { email, password } = data;

  let user = await UserModel.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());
  return {
    accessToken,
    refreshToken,
  };
};
