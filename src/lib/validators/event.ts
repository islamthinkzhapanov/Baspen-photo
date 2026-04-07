import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens"),
  description: z.string().max(2000).optional(),
  isPublished: z.boolean().optional(),
  date: z.string().optional(),
  location: z.string().max(500).optional(),
  pricingMode: z.enum(["exclusive", "commission"]).default("commission"),
  settings: z
    .object({
      freeDownload: z.boolean().optional(),
      watermarkEnabled: z.boolean().optional(),
      pricePerPhoto: z.number().min(0).optional(),
      packageDiscount: z.number().min(0).max(100).optional(),
      bibSearchEnabled: z.boolean().optional(),
    })
    .optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.literal("photographer"),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
