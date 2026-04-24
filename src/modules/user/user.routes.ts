import { Router } from "express";
import {
  getProfile, updateProfile, updatePassword,
  updatePreferencesController, uploadAvatarController, deleteAccountController,
  listTokensController, createTokenController, revokeTokenController,
} from "./user.controller.js";

const router = Router();

router.get("/profile",           getProfile);
router.patch("/profile",         updateProfile);
router.patch("/password",        updatePassword);
router.patch("/preferences",     updatePreferencesController);
router.post("/avatar",           uploadAvatarController);
router.delete("/account",        deleteAccountController);

router.get("/tokens",            listTokensController);
router.post("/tokens",           createTokenController);
router.delete("/tokens/:token_id", revokeTokenController);

export default router;
