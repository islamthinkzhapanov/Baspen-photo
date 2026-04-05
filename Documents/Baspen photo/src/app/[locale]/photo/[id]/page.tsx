import { Metadata } from "next";
import { db } from "@/lib/db";
import { photos, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PhotoDetailClient } from "@/components/gallery/PhotoDetailClient";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

// Dynamic OG meta tags for shared photos
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const [photo] = await db
    .select({
      id: photos.id,
      watermarkedPath: photos.watermarkedPath,
      thumbnailPath: photos.thumbnailPath,
      width: photos.width,
      height: photos.height,
      eventId: photos.eventId,
    })
    .from(photos)
    .where(eq(photos.id, id))
    .limit(1);

  if (!photo) {
    return { title: "Photo not found" };
  }

  const [event] = await db
    .select({ title: events.title, slug: events.slug })
    .from(events)
    .where(eq(events.id, photo.eventId))
    .limit(1);

  const imageUrl = photo.watermarkedPath || photo.thumbnailPath || "";
  const title = event ? `${event.title} — Baspen` : "Photo — Baspen";

  return {
    title,
    openGraph: {
      title,
      type: "website",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: photo.width || undefined,
              height: photo.height || undefined,
              alt: event?.title || "Photo",
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function PhotoPage({ params }: Props) {
  const { id } = await params;
  return <PhotoDetailClient photoId={id} />;
}
