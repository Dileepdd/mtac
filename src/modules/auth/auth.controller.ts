import { Request, Response } from "express";
import { registerUser, loginUser } from "./auth.service.js";
import { registerSchema, logInSchema } from "./auth.validation.js";

export const register = async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);
    const user = await registerUser(body);

    const { password: _, ...safeUser } = user.toObject();

    res.status(201).json({
      success: true,
      message: "user registered successfully",
      data: safeUser,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const logIn = async (req: Request, res: Response) => {
  try {
    const body = logInSchema.parse(req.body);

    const { accessToken, refreshToken } = await loginUser(body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "LogIn successful",
      data: { accessToken },
    });
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};
