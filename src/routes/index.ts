import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { workspaceMiddleware } from "../middlewares/workspace.middleware.js";

import authRoutes from "../modules/auth/auth.route.js";
import workspaceRoutes from "../modules/workspace/workspace.route.js";
import workspaceMemberRoutes from "../modules/workspaceMember/workspaceMember.route.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/workspace", authMiddleware, workspaceRoutes);
router.use(
  "/workspace-member/:workspace_id",
  authMiddleware,
  workspaceMiddleware,
  workspaceMemberRoutes
);

export default router;
