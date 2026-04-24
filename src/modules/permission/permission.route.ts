import { Router } from "express";
import { listPermissions } from "./permission.controller.js";

const router = Router();
router.get("/", listPermissions);
export default router;
