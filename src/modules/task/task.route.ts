import { Router } from "express";
import { checkPermission } from "../../middlewares/permission.middleware.js";
import { create, list, get, update, remove, assign } from "./task.controller.js";

const router = Router({ mergeParams: true });

router.post("/", checkPermission("CREATE_TASK"), create);
router.get("/", checkPermission("VIEW_TASK"), list);
router.get("/:task_id", checkPermission("VIEW_TASK"), get);
router.patch("/:task_id", checkPermission("UPDATE_TASK"), update);
router.delete("/:task_id", checkPermission("DELETE_TASK"), remove);
router.patch("/:task_id/assign", checkPermission("ASSIGN_TASK"), assign);

export default router;
