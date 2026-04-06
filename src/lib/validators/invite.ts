import { z } from "zod";

export const createInviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200).optional(),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});
