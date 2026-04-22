import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, logIn, refresh } from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { Request, Response } from "express";

const router = Router();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => process.env.NODE_ENV === "test",
  message: { success: false, message: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", register);
router.post("/login", loginRateLimiter, logIn);
router.post("/refresh", refresh);

router.get("/test-auth", authMiddleware, (_req: Request, res: Response) => {
  console.log("auth test");
  res.status(200).send("auth success");
});

export default router;
