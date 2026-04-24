// src/types/express/index.d.ts
import "express";

// Extend Express.User so passport's req.user typing aligns with our JWT payload
declare global {
  namespace Express {
    interface User {
      id: string;
    }
  }
}

declare module "express-serve-static-core" {
  interface ParamsDictionary {
    [key: string]: string;
  }

  interface Request {
    id?: string;
    workspace?: {
      id: string;
      roleId: string;
      level?: number;
      allPermissions?: boolean;
      permissions?: string[];
    };
  }
}
