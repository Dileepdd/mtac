import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../errors/appError.js";

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("No token provided", 401, "UNAUTHORIZED"));
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      userId: string;
    };

    req.user = { id: decoded.userId };
    next();
  } catch {
    return next(new AppError("Invalid or expired token", 401, "UNAUTHORIZED"));
  }
};
