import { Router } from "express";
import { workspaceMiddleware } from "../../middlewares/workspace.middleware.js";
import { checkPermission } from "../../middlewares/permission.middleware.js";

import { create, get, getAll } from "./workspace.controller.js";

const router = Router();

router.post("/create", create);

router.get("/", getAll);

router.get(
  "/:workspace_id",
  workspaceMiddleware,
  checkPermission("VIEW_WORKSPACE"),
  get
);

export default router;
