export const ROLE_CONFIG = {
  admin: {
    level: 0,
    permissions: "ALL",
  },
  manager: {
    level: 1,
    permissions: [
      "VIEW_WORKSPACE",
      "CREATE_PROJECT",
      "UPDATE_PROJECT",
      "VIEW_TASK",
      "CREATE_TASK",
      "UPDATE_TASK",
    ],
  },
  member: {
    level: 2,
    permissions: ["VIEW_WORKSPACE", "VIEW_PROJECT", "VIEW_TASK"],
  },
} as const;
