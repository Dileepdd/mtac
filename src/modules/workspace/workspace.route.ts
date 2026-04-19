import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { workspaceMiddleware } from "../../middlewares/workspace.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";

import { create, get } from "./workspace.controller";

const router = Router();

router.post("/create", authMiddleware, create);
router.get(
  "/:workspace_id",
  authMiddleware,
  workspaceMiddleware,
  checkPermission("VIEW_WORKSPACE"),
  get
);
export default router;
