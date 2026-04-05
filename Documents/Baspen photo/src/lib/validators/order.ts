import { z } from "zod";

export const createOrderSchema = z.object({
  eventId: z.string().uuid(),
  photoIds: z.array(z.string().uuid()).min(1),
  isPackage: z.boolean().default(false),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional(),
  paymentMethod: z.enum(["kaspi", "stripe", "manual"]).default("manual"),
  sessionToken: z.string().optional(),
});

export const verifyDownloadSchema = z.object({
  token: z.string().min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
