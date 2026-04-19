import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized: No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      userId: string;
    };

    req.user = {
      id: decoded.userId,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized: Invalid or expired token",
    });
  }
};
