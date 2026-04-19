export const DEFAULT_PERMISSIONS = [
  // Workspace
  { name: "VIEW_WORKSPACE" },
  { name: "UPDATE_WORKSPACE" },
  { name: "DELETE_WORKSPACE" },
  { name: "INVITE_USER" },
  { name: "REMOVE_USER" },

  // 👥 Members (IMPORTANT ADDITION)
  { name: "VIEW_MEMBERS" },
  { name: "UPDATE_MEMBER_ROLE" },

  // Project
  { name: "CREATE_PROJECT" },
  { name: "VIEW_PROJECT" },
  { name: "UPDATE_PROJECT" },
  { name: "DELETE_PROJECT" },

  // Task
  { name: "CREATE_TASK" },
  { name: "VIEW_TASK" },
  { name: "UPDATE_TASK" },
  { name: "DELETE_TASK" },
  { name: "ASSIGN_TASK" },

  // Roles
  { name: "ASSIGN_ROLE" },
  { name: "CHANGE_ROLE" },
];
