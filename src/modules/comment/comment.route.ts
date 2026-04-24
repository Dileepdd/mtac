import { Router } from "express";
import { checkPermission } from "../../middlewares/permission.middleware.js";
import { list, add } from "./comment.controller.js";

const router = Router({ mergeParams: true });

router.get("/",  checkPermission("VIEW_TASK"),   list);
router.post("/", checkPermission("CREATE_TASK"), add);

export default router;
