import { Router } from "express";
import { checkPermission } from "../../middlewares/permission.middleware.js";
import { create, list, get, update, remove } from "./project.controller.js";

const router = Router({ mergeParams: true });

router.post("/", checkPermission("CREATE_PROJECT"), create);
router.get("/", checkPermission("VIEW_PROJECT"), list);
router.get("/:project_id", checkPermission("VIEW_PROJECT"), get);
router.patch("/:project_id", checkPermission("UPDATE_PROJECT"), update);
router.delete("/:project_id", checkPermission("DELETE_PROJECT"), remove);

export default router;
