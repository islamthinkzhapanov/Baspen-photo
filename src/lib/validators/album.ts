import { z } from "zod";

export const createAlbumSchema = z.object({
  name: z.string().min(1).max(200),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateAlbumSchema = createAlbumSchema.partial();

export const reorderAlbumsSchema = z.object({
  albumIds: z.array(z.string().uuid()),
});

export const movePhotosSchema = z.object({
  photoIds: z.array(z.string().uuid()).min(1),
  albumId: z.string().uuid().nullable(),
});

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>;
