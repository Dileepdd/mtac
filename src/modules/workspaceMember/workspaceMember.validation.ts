import { z } from "zod";

export const addMemberSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1).optional(),
});

export const updateMemberSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
});

export type AddMemberDTO = z.infer<typeof addMemberSchema>;
