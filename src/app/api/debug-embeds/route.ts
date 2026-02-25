import * as cheerio from "cheerio";
import { safeFetch } from "@/lib/sources/safeFetch";
import {
  parseStreamIframeFromHtml,
  isInvalidEmbedUrl,
  isListingOrNavUrl,
  isNonStreamEmbedUrl,
} from "@/lib/sources/parseStreamIframeFromHtml";
import { fetchStreameastGlMatches } from "@/lib/sources/fetchStreameastGl";
import { fetchXstreameastMatches } from "@/lib/sources/fetchXstreameast";

type IframeDebug = {
  src: string;
  resolved: string;
  invalid: boolean;
  nonStream: boolean;
  listingNav: boolean;
  wouldAccept: boolean;
};

type PageResult = {
  source: string;
  detailUrl: string;
  fetchOk: boolean;
  fetchError?: string;
  iframes: IframeDebug[];
  resolvedEmbed: string | null;
};

/**
 * GET /api/debug-embeds
 * Fetches a few detail URLs from streameast + xstreameast, runs parser,
 * and returns per-page: iframes with reject reasons and final resolved embed.
 */
export async function GET() {
  const results: PageResult[] = [];

  try {
    const [streameastMatches, xstreameastMatches] = await Promise.all([
      fetchStreameastGlMatches().catch(() => []),
      fetchXstreameastMatches().catch(() => []),
    ]);

    let streameastUrls = streameastMatches
      .filter((m) => m.status === "LIVE")
      .slice(0, 3)
      .map((m) => m.url);
    let xstreameastUrls = xstreameastMatches
      .filter((m) => m.status === "LIVE")
      .slice(0, 3)
      .map((m) => m.url);
    if (streameastUrls.length === 0 && streameastMatches.length > 0) {
      streameastUrls = streameastMatches.slice(0, 2).map((m) => m.url);
    }
    if (xstreameastUrls.length === 0 && xstreameastMatches.length > 0) {
      xstreameastUrls = xstreameastMatches.slice(0, 2).map((m) => m.url);
    }

    const urlsToCheck: { source: string; url: string }[] = [
      ...streameastUrls.slice(0, 3).map((url) => ({ source: "streameast", url })),
      ...xstreameastUrls.slice(0, 3).map((url) => ({ source: "xstreameast", url })),
    ];

    for (const { source, url } of urlsToCheck) {
      const page: PageResult = {
        source,
        detailUrl: url,
        fetchOk: false,
        iframes: [],
        resolvedEmbed: null,
      };

      try {
        const html = await safeFetch(url);
        page.fetchOk = true;

        const $ = cheerio.load(html);
        $("iframe[src]").each((_, el) => {
          const src = $(el).attr("src") ?? "";
          let resolved = "";
          try {
            resolved = new URL(src, url).href;
          } catch {
            resolved = "(invalid)";
          }
          const invalid = resolved !== "(invalid)" && isInvalidEmbedUrl(resolved);
          const nonStream = resolved !== "(invalid)" && isNonStreamEmbedUrl(resolved);
          const listingNav = resolved !== "(invalid)" && isListingOrNavUrl(resolved, url);
          const wouldAccept =
            resolved !== "(invalid)" && !invalid && !nonStream && !listingNav;
          page.iframes.push({
            src,
            resolved,
            invalid,
            nonStream,
            listingNav,
            wouldAccept,
          });
        });

        page.resolvedEmbed = parseStreamIframeFromHtml(html, url);
      } catch (e) {
        page.fetchError = e instanceof Error ? e.message : String(e);
      }

      results.push(page);
    }

    return Response.json({
      summary: {
        total: results.length,
        fetchOk: results.filter((r) => r.fetchOk).length,
        withResolvedEmbed: results.filter((r) => r.resolvedEmbed).length,
      },
      results,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ error: message, results: [] }, { status: 500 });
  }
}
