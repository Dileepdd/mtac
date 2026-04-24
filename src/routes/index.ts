import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { workspaceMiddleware } from "../middlewares/workspace.middleware.js";

import authRoutes          from "../modules/auth/auth.route.js";
import workspaceRoutes     from "../modules/workspace/workspace.route.js";
import workspaceMemberRoutes from "../modules/workspaceMember/workspaceMember.route.js";
import projectRoutes       from "../modules/project/project.route.js";
import taskRoutes          from "../modules/task/task.route.js";
import commentRoutes       from "../modules/comment/comment.route.js";
import userRoutes          from "../modules/user/user.routes.js";
import roleRoutes          from "../modules/role/role.route.js";
import permissionRoutes    from "../modules/permission/permission.route.js";

const router = Router();

router.use("/auth",      authRoutes);
router.use("/workspace", authMiddleware, workspaceRoutes);

router.use(
  "/workspace-member/:workspace_id",
  authMiddleware, workspaceMiddleware,
  workspaceMemberRoutes
);
router.use(
  "/workspace/:workspace_id/project",
  authMiddleware, workspaceMiddleware,
  projectRoutes
);
router.use(
  "/workspace/:workspace_id/project/:project_id/task",
  authMiddleware, workspaceMiddleware,
  taskRoutes
);
router.use(
  "/workspace/:workspace_id/project/:project_id/task/:task_id/comments",
  authMiddleware, workspaceMiddleware,
  commentRoutes
);
router.use("/user",        authMiddleware, userRoutes);
router.use("/permissions", authMiddleware, permissionRoutes);
router.use(
  "/workspace/:workspace_id/role",
  authMiddleware, workspaceMiddleware,
  roleRoutes
);

export default router;
