import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { registerUser, loginUser } from "./auth.service.js";
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
    if (err?.message === "User already exists") {
      return next(new AppError("User already exists", 409, "USER_EXISTS"));
    }
    return next(new AppError("Registration failed", 500, "REGISTER_FAILED"));
  }
};

export const logIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = logInSchema.parse(req.body);

    const { accessToken } = await loginUser(body);

    res.status(200).json({
      success: true,
      message: "LogIn successful",
      data: { accessToken },
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", err.issues));
    }
    if (err?.message === "Invalid email or password") {
      return next(new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS"));
    }
    return next(new AppError("Login failed", 500, "LOGIN_FAILED"));
  }
};
