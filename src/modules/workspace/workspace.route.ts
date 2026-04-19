import { Router } from "express";
import { workspaceMiddleware } from "../../middlewares/workspace.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";

import { create, get, getAll } from "./workspace.controller";

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
