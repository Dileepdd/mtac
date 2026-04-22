import { Router } from "express";
import { checkPermission } from "../../middlewares/permission.middleware.js";
import { list, updatePermissions } from "./role.controller.js";

const router = Router({ mergeParams: true });

router.get("/", checkPermission("VIEW_WORKSPACE"), list);
router.patch("/:role_id/permissions", checkPermission("CHANGE_ROLE"), updatePermissions);

export default router;
