// src/types/express/index.d.ts
import "express";

declare module "express" {
  interface Request {
    user?: { id: string };
    workspace?: {
      id: string;
      roleId: string;
      level?: number;
      permissions?: string[];
    };
  }
}
