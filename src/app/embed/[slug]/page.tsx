import { PublicEventPage } from "@/components/event/PublicEventPage";

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const embedConfig = {
    theme: (sp.theme as string) === "dark" ? ("dark" as const) : ("light" as const),
    showBranding: sp.branding !== "false",
    showSponsors: sp.sponsors !== "false",
  };

  return <PublicEventPage slug={slug} embedConfig={embedConfig} />;
}
