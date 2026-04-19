import { Router } from "express";

import authRoutes from "../modules/auth/auth.route.js";
import workspaceRoutes from "../modules/workspace/workspace.route.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/workspace", workspaceRoutes);

export default router;
