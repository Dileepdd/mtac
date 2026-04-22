export const ROLE_CONFIG = {
  admin: {
    level: 0,
    permissions: "ALL",
  },
  manager: {
    level: 1,
    permissions: [
      "VIEW_WORKSPACE",
      "VIEW_MEMBERS",
      "CREATE_PROJECT",
      "UPDATE_PROJECT",
      "DELETE_PROJECT",
      "VIEW_PROJECT",
      "VIEW_TASK",
      "CREATE_TASK",
      "UPDATE_TASK",
      "DELETE_TASK",
      "ASSIGN_TASK",
    ],
  },
  member: {
    level: 2,
    permissions: ["VIEW_WORKSPACE", "VIEW_MEMBERS", "VIEW_PROJECT", "VIEW_TASK"],
  },
} as const;
