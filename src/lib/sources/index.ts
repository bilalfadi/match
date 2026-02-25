import { fetchStreameastGlMatches } from "./fetchStreameastGl";
import { fetchXstreameastMatches } from "./fetchXstreameast";
import { fetchLivekoraMatches } from "./fetchLivekora";
import { safeFetch } from "./safeFetch";
import { parseStreamIframeFromHtml, isInvalidEmbedUrl, isListingOrNavUrl } from "./parseStreamIframeFromHtml";
import { browserFetchEmbedUrl } from "./browserFetchDetailPage";
import type { MatchSummary } from "./types";

export interface MatchWithEmbed extends MatchSummary {
  embedUrl: string;
}

const NON_SOCCER_KEYWORDS = [
  "nba",
  "nfl",
  "nhl",
  "mlb",
  "ufc",
  "mma",
  "boxing",
  "basketball",
  "formula 1",
  "f1 ",
  "nascar",
  "wwe",
];

function isSoccerMatch(m: MatchSummary): boolean {
  const t = `${m.title ?? ""} ${m.homeTeam ?? ""} ${m.awayTeam ?? ""}`.toLowerCase();
  return !NON_SOCCER_KEYWORDS.some((k) => t.includes(k));
}

/**
 * Fetch from 3 sources, keep only soccer + LIVE. For each match try to resolve embed URL;
 * return all LIVE matches (embedUrl set when found, else ""). Detail page resolves embed on open if needed.
 */
export async function fetchLiveMatchesWithEmbed(): Promise<MatchWithEmbed[]> {
  const [streameast, xstreameast, livekora] = await Promise.all([
    fetchStreameastGlMatches().catch(() => [] as MatchSummary[]),
    fetchXstreameastMatches().catch(() => [] as MatchSummary[]),
    fetchLivekoraMatches().catch(() => [] as MatchSummary[]),
  ]);

  const all: MatchSummary[] = [...streameast, ...xstreameast, ...livekora];
  const soccerOnly = all.filter(isSoccerMatch);
  const liveOnly = soccerOnly.filter((m) => m.status === "LIVE");

  const withEmbed: MatchWithEmbed[] = [];

  for (const m of liveOnly) {
    let embedUrl = "";

    if (m.source === "livekora") {
      if (!isInvalidEmbedUrl(m.url)) embedUrl = m.url;
    } else {
      try {
        const html = await safeFetch(m.url);
        const resolved = parseStreamIframeFromHtml(html, m.url);
        if (
          resolved &&
          resolved.trim() &&
          !isInvalidEmbedUrl(resolved) &&
          !isListingOrNavUrl(resolved, m.url)
        ) {
          embedUrl = resolved.trim();
        }
      } catch {
        // keep embedUrl ""
      }
      if (!embedUrl) {
        try {
          const browserResolved = await browserFetchEmbedUrl(m.url);
          if (
            browserResolved &&
            browserResolved.trim() &&
            !isInvalidEmbedUrl(browserResolved) &&
            !isListingOrNavUrl(browserResolved, m.url)
          )
            embedUrl = browserResolved.trim();
        } catch {
          // keep embedUrl ""; detail page will try to resolve on open
        }
      }
    }

    if (embedUrl && (isInvalidEmbedUrl(embedUrl) || isListingOrNavUrl(embedUrl, m.url))) {
      embedUrl = "";
    }
    withEmbed.push({ ...m, embedUrl: embedUrl.trim() });
  }

  return withEmbed;
}

export type { MatchSummary } from "./types";
export { encodeMatchId, decodeMatchId } from "./types";
export { parseMatchLine } from "./parseMatchLine";
export {
  parseStreamIframeFromHtml,
  isInvalidEmbedUrl,
  isListingOrNavUrl,
  isAcceptableEmbedUrl,
} from "./parseStreamIframeFromHtml";
