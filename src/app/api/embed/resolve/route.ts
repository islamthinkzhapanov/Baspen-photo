import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { embedWidgets, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withHandler } from "@/lib/api-handler";

// GET /api/embed/resolve?domain=photos.example.com
// Used by middleware to resolve custom domain → event slug + widget config
export const GET = withHandler(async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json({ error: "Missing domain" }, { status: 400 });
  }

  const [widget] = await db
    .select({
      slug: events.slug,
      config: embedWidgets.config,
    })
    .from(embedWidgets)
    .innerJoin(events, eq(events.id, embedWidgets.eventId))
    .where(eq(embedWidgets.customDomain, domain))
    .limit(1);

  if (!widget) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  return NextResponse.json({ slug: widget.slug, config: widget.config });
});
