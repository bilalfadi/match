import { NextRequest, NextResponse } from "next/server";
import { safeFetch } from "@/lib/sources/safeFetch";
import {
  parseStreamIframeFromHtml,
  isInvalidEmbedUrl,
  isListingOrNavUrl,
} from "@/lib/sources/parseStreamIframeFromHtml";
import { browserFetchEmbedUrl } from "@/lib/sources/browserFetchDetailPage";

/**
 * GET /api/extract-embed?url=...
 * Detail page ka link do, code wahan se embed link nikal ke dega.
 * Pehle static fetch, agar na mile to browser (Puppeteer) try.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !url.startsWith("http")) {
    return NextResponse.json(
      { ok: false, error: "url query chahiye (e.g. ?url=https://...)" },
      { status: 400 }
    );
  }

  try {
    let embedUrl: string | null = null;

    try {
      const html = await safeFetch(url);
      const resolved = parseStreamIframeFromHtml(html, url);
      if (
        resolved &&
        resolved.trim() &&
        !isInvalidEmbedUrl(resolved) &&
        !isListingOrNavUrl(resolved, url)
      ) {
        embedUrl = resolved.trim();
      }
    } catch {}

    if (!embedUrl) {
      try {
        const browserResolved = await browserFetchEmbedUrl(url);
        if (
          browserResolved &&
          browserResolved.trim() &&
          !isInvalidEmbedUrl(browserResolved) &&
          !isListingOrNavUrl(browserResolved, url)
        ) {
          embedUrl = browserResolved.trim();
        }
      } catch {}
    }

    if (embedUrl) {
      return NextResponse.json({ ok: true, detailUrl: url, embedUrl });
    }
    return NextResponse.json({
      ok: false,
      detailUrl: url,
      embedUrl: null,
      message: "Is detail page se koi valid embed link nahi mila.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: message, detailUrl: url },
      { status: 500 }
    );
  }
}
