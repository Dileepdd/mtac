import { Router } from "express";
import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import passport from "../../config/passport.js";
import { env } from "../../config/env.js";
import { register, logIn, refresh, forgotPassword, resetPasswordController, verifyEmailController, resendOtpController, googleCallback } from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { acceptInvite, inviteInfo } from "../invitation/invitation.controller.js";

const router = Router();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => process.env.NODE_ENV === "test",
  message: { success: false, message: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: () => process.env.NODE_ENV === "test",
  message: { success: false, message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", register);
router.post("/login", loginRateLimiter, logIn);
router.post("/refresh", refresh);
router.post("/verify-email", verifyEmailController);
router.post("/resend-otp", forgotPasswordRateLimiter, resendOtpController);
router.post("/forgot-password", forgotPasswordRateLimiter, forgotPassword);
router.post("/reset-password/:token", resetPasswordController);
router.get("/invite-info/:token", inviteInfo);
router.post("/accept-invite/:token", authMiddleware, acceptInvite);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get("/google/callback", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    "google",
    { session: false },
    (err: unknown, user: Express.User | false) => {
      if (err || !user) {
        // Redirect to frontend so the browser gets a proper page (not a JSON error)
        return res.redirect(`${env.APP_URL}/auth/callback?error=google_auth_failed`);
      }
      googleCallback(res, next, user);
    }
  )(req, res, next);
});

router.get("/test-auth", authMiddleware, (_req: Request, res: Response) => {
  console.log("auth test");
  res.status(200).send("auth success");
});

export default router;
