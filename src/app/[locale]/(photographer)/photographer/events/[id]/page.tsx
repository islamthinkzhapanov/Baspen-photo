import { PhotographerEventPage } from "@/components/photographer/PhotographerEventPage";

export default async function PhotographerEventRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PhotographerEventPage eventId={id} />;
}
