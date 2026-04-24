import { Router } from "express";
import { checkPermission } from "../../middlewares/permission.middleware.js";
import { add, getMembers, update, remove } from "./workspaceMember.controller.js";
import { invite } from "../invitation/invitation.controller.js";

const router = Router({ mergeParams: true });
router.post("/create", checkPermission("ADD_MEMBER"), add);
router.post("/invite", checkPermission("ADD_MEMBER"), invite);
router.patch("/update", checkPermission("ASSIGN_ROLE"), update);
router.get("/", checkPermission("VIEW_MEMBERS"), getMembers);
router.delete("/remove", checkPermission("REMOVE_MEMBER"), remove);

export default router;
