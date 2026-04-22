import { Router } from "express";
import { getProfile, updateProfile, updatePassword } from "./user.controller.js";

const router = Router();

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.patch("/password", updatePassword);

export default router;
