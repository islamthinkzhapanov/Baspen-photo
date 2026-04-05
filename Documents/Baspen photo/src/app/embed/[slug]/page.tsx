import { PublicEventPage } from "@/components/event/PublicEventPage";

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicEventPage slug={slug} />;
}
