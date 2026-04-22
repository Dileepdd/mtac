import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { registerUser, loginUser, refreshAccessToken } from "./auth.service.js";
import { registerSchema, logInSchema } from "./auth.validation.js";
import { AppError } from "../../errors/appError.js";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
    if (err instanceof ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    }
    return next(err);
  }
};

export const logIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = logInSchema.parse(req.body);

    const { accessToken, refreshToken } = await loginUser(body);

    res.status(200).json({
      success: true,
      message: "LogIn successful",
      data: { accessToken, refreshToken },
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    }
    return next(err);
  }
};

export const refresh = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== "string") {
      return next(new AppError("refreshToken is required", 400, "MISSING_REFRESH_TOKEN"));
    }

    const { accessToken } = refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: { accessToken },
    });
  } catch (err: any) {
    return next(err);
  }
};
