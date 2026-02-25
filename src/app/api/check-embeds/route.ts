import { findMatches } from "@/lib/data/matches";
import { safeFetch } from "@/lib/sources/safeFetch";
import { parseStreamIframeFromHtml, isInvalidEmbedUrl, isListingOrNavUrl } from "@/lib/sources/parseStreamIframeFromHtml";

/**
 * GET /api/check-embeds
 * Quick check: pick up to 5 LIVE matches from store, static-fetch each detail URL,
 * run parser, return per-URL whether embed was found. No Puppeteer.
 */
export async function GET() {
  const results: { homeTeam: string; awayTeam: string; detailUrl: string; gotEmbed: boolean; embedUrl: string | null }[] = [];
  try {
    const live = await findMatches("LIVE");
    const toCheck = live.filter((m) => m.sourceDetailUrl?.trim()).slice(0, 5);

    for (const m of toCheck) {
      const detailUrl = m.sourceDetailUrl!.trim();
      let embedUrl: string | null = null;
      try {
        const html = await safeFetch(detailUrl);
        const resolved = parseStreamIframeFromHtml(html, detailUrl);
        if (resolved && resolved.trim() && !isInvalidEmbedUrl(resolved) && !isListingOrNavUrl(resolved, detailUrl)) {
          embedUrl = resolved.trim();
        }
      } catch {
        // fetch or parse failed
      }
      results.push({
        homeTeam: m.homeTeam ?? "?",
        awayTeam: m.awayTeam ?? "?",
        detailUrl,
        gotEmbed: !!embedUrl,
        embedUrl,
      });
    }

    const withEmbed = results.filter((r) => r.gotEmbed).length;
    return Response.json({
      summary: { totalChecked: results.length, withEmbed },
      results,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ error: message, results: [] }, { status: 500 });
  }
}
