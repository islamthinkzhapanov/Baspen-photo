import { z } from "zod";

export const createSponsorSchema = z.object({
  name: z.string().min(1).max(200),
  logoUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateSponsorSchema = createSponsorSchema.partial();

export const createWidgetSchema = z.object({
  eventId: z.string().uuid(),
  customDomain: z.string().max(255).optional(),
  config: z
    .object({
      theme: z.enum(["light", "dark"]).default("light"),
      showBranding: z.boolean().default(true),
      showSponsors: z.boolean().default(true),
      maxWidth: z.number().int().min(300).max(1920).optional(),
      primaryColor: z.string().max(20).optional(),
    })
    .optional(),
});

export type CreateSponsorInput = z.infer<typeof createSponsorSchema>;
export type UpdateSponsorInput = z.infer<typeof updateSponsorSchema>;
export type CreateWidgetInput = z.infer<typeof createWidgetSchema>;
