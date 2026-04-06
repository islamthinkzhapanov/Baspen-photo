import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/** Known app hostnames — requests from other hosts are treated as custom domains */
const APP_HOSTS = new Set(
  [
    process.env.NEXT_PUBLIC_APP_URL,
    "localhost",
    "127.0.0.1",
  ]
    .filter(Boolean)
    .map((h) => {
      try {
        return new URL(h!.startsWith("http") ? h! : `https://${h}`).hostname;
      } catch {
        return h!;
      }
    })
);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip i18n for API routes, Next.js internals, and embed pages
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/embed") ||
    pathname.includes(".")
  ) {
    return;
  }

  // Custom domain routing: if the hostname is not ours, rewrite to /embed lookup
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";
  if (hostname && !APP_HOSTS.has(hostname)) {
    // Resolve custom domain → event slug via internal API
    const resolveUrl = new URL("/api/embed/resolve", request.url);
    resolveUrl.searchParams.set("domain", hostname);

    try {
      const res = await fetch(resolveUrl.toString());
      if (res.ok) {
        const { slug, config } = await res.json();
        const embedUrl = request.nextUrl.clone();
        embedUrl.pathname = `/embed/${slug}`;
        if (config?.theme) embedUrl.searchParams.set("theme", config.theme);
        if (config?.showBranding === false)
          embedUrl.searchParams.set("branding", "false");
        if (config?.showSponsors === false)
          embedUrl.searchParams.set("sponsors", "false");
        return NextResponse.rewrite(embedUrl);
      }
    } catch {
      // Domain not found or fetch failed — fall through to normal routing
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
