// src/types/express/index.d.ts
import "express";

declare module "express-serve-static-core" {
  interface ParamsDictionary {
    [key: string]: string;
  }

  interface Request {
    id?: string;
    user?: { id: string };
    workspace?: {
      id: string;
      roleId: string;
      level?: number;
      allPermissions?: boolean;
      permissions?: string[];
    };
  }
}
