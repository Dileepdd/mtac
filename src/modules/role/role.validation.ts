import { z } from "zod";

export const updateRolePermissionsSchema = z.object({
  permissions: z
    .array(z.string().min(1))
    .min(1, "At least one permission is required"),
});
