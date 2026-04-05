import { PublicEventPage } from "@/components/event/PublicEventPage";

export default async function EventPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicEventPage slug={slug} />;
}
