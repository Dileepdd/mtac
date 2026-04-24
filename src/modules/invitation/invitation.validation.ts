import { z } from "zod";

export const sendInviteSchema = z.object({
  email: z.email().trim().toLowerCase(),
  roleId: z.string().optional(),
});

export type SendInviteDTO = z.infer<typeof sendInviteSchema>;
