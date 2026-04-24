import { Router } from "express";
import { workspaceMiddleware } from "../../middlewares/workspace.middleware.js";
import { checkPermission } from "../../middlewares/permission.middleware.js";
import { create, get, getAll, update, stats, activity, myTasks, remove } from "./workspace.controller.js";

const router = Router();

router.post("/create", create);
router.get("/",        getAll);

router.get(
  "/:workspace_id",
  workspaceMiddleware,
  checkPermission("VIEW_WORKSPACE"),
  get
);

router.patch(
  "/:workspace_id",
  workspaceMiddleware,
  checkPermission("UPDATE_WORKSPACE"),
  update
);

router.get(
  "/:workspace_id/stats",
  workspaceMiddleware,
  checkPermission("VIEW_WORKSPACE"),
  stats
);

router.get(
  "/:workspace_id/activity",
  workspaceMiddleware,
  checkPermission("VIEW_WORKSPACE"),
  activity
);

router.get(
  "/:workspace_id/my-tasks",
  workspaceMiddleware,
  checkPermission("VIEW_TASK"),
  myTasks
);

router.delete(
  "/:workspace_id",
  workspaceMiddleware,
  checkPermission("DELETE_WORKSPACE"),
  remove
);

export default router;
