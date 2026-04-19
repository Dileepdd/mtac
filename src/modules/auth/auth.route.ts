import { Router } from "express";
import { register, logIn } from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { Request, Response } from "express";

const router = Router();

router.post("/register", register);
router.post("/login", logIn);

router.get("/test-auth", authMiddleware, (req: Request, res: Response) => {
  console.log("auth test");
  res.status(200).send("auth success");
});

export default router;
