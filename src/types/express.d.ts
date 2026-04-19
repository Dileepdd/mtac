export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
      workspace?: {
        id: string;
        roleId: string;
      };
    }
  }
}
