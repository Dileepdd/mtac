import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-f]{24}$/i, "Invalid ID format");

export const addMemberSchema = z.object({
  userId: objectId,
  roleId: objectId.optional(),
});

export const updateMemberSchema = z.object({
  userId: objectId,
  roleId: objectId,
});

export const removeMemberSchema = z.object({
  userId: objectId,
});

export type AddMemberDTO = z.infer<typeof addMemberSchema>;
