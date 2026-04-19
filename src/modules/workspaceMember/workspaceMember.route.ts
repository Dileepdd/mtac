import { Router } from "express";
import { checkPermission } from "../../middlewares/permission.middleware.js";
import { add, getMembers, update } from "./workspaceMember.controller.js";

const router = Router({ mergeParams: true });
router.post("/create", checkPermission("ADD_MEMBER"), add);
router.patch("/update", checkPermission("CHANGE_ROLE"), update);
router.get("/", checkPermission("VIEW_MEMBERS"), getMembers);

export default router;
