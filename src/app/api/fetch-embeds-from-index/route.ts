import * as cheerio from "cheerio";
import { safeFetch } from "@/lib/sources/safeFetch";
import {
  parseStreamIframeFromHtml,
  isInvalidEmbedUrl,
} from "@/lib/sources/parseStreamIframeFromHtml";

type EmbedItem = {
  label: string;
  detailUrl: string;
  embedUrl: string;
  matchTitle: string | null;
  leagueName: string | null;
  language: string | null;
};

const LANGUAGE_WORDS = /(english|german|italian|turkish|spanish|french|portuguese|arabic)\b/i;
function parseLanguageFromText(text: string): string | null {
  const m = text.match(LANGUAGE_WORDS);
  return m ? m[1].toLowerCase() : null;
}

/** Parse ads count from row (Ads column usually has 1, 2, or 3). Lower = higher priority. */
function parseAdsFromRow($: ReturnType<typeof cheerio.load>, row: cheerio.Cheerio<cheerio.Element>): number {
  let ads = 99;
  row.find("td").each((_, td) => {
    const t = $(td).text().trim();
    if (t === "1" || t === "2" || t === "3") {
      ads = parseInt(t, 10);
      return false; // break
    }
  });
  return ads;
}

type ApiResponse =
  | { ok: true; indexUrl: string; embeds: EmbedItem[] }
  | { ok: false; error: string };

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return "https://" + trimmed;
  }
  return trimmed;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { indexUrl?: string };
    const rawUrl = body?.indexUrl || "";
    if (!rawUrl || typeof rawUrl !== "string") {
      const res: ApiResponse = { ok: false, error: "Missing indexUrl" };
      return Response.json(res, { status: 400 });
    }

    const indexUrl = normalizeUrl(rawUrl);
    const html = await safeFetch(indexUrl);
    const $ = cheerio.load(html);

    let indexHost = "";
    try {
      indexHost = new URL(indexUrl).hostname.toLowerCase();
    } catch {
      indexHost = "";
    }

    type LinkInfo = { label: string; language: string | null; ads: number };
    const linkMap = new Map<string, LinkInfo>(); // detailUrl -> { label, language, ads }

    // Sportsurge/Streameast: real stream URLs are in hidden inputs id="linkk123" (value=URL)
    $('input[type="hidden"][id^="linkk"]').each((_, el) => {
      const value = $(el).attr("value");
      if (!value) return;
      let full: string;
      try {
        full = new URL(value.trim(), indexUrl).href;
      } catch {
        return;
      }
      try {
        const path = new URL(full).pathname.toLowerCase();
        if (/^\/(news|article|blog|category)\//.test(path) || path.startsWith("/news")) return;
      } catch {
        return;
      }
      const row = $(el).closest("tr");
      let label = "Stream";
      let language: string | null = null;
      let ads = 99;
      if (row.length) {
        const tds = row.find("td");
        const firstCell = tds.first().text().trim().replace(/\s+/g, " ");
        if (firstCell) label = firstCell;
        tds.each((i, td) => {
          const cellText = $(td).text().trim().toLowerCase();
          if (LANGUAGE_WORDS.test(cellText)) {
            const m = cellText.match(LANGUAGE_WORDS);
            if (m) language = m[1].toLowerCase();
            return false;
          }
        });
        ads = parseAdsFromRow($, row);
      }
      if (!linkMap.has(full)) linkMap.set(full, { label, language, ads });
    });

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      let full: string;
      try {
        full = new URL(href, indexUrl).href;
      } catch {
        return;
      }

      // Skip links that stay on the same host as the index page (register/rules/home etc).
      if (indexHost) {
        try {
          const linkHost = new URL(full).hostname.toLowerCase();
          if (linkHost === indexHost) return;
        } catch {
          // ignore parse failures
        }
      }

      // Skip obvious non-stream pages (news, articles) so we don't pick footer/nav links
      try {
        const path = new URL(full).pathname.toLowerCase();
        if (/^\/(news|article|blog|category)\//.test(path) || path.startsWith("/news")) return;
      } catch {
        // ignore
      }

      const text = $(el).text().trim();
      const lowerText = text.toLowerCase();

      // Totalsportek: "Watch" | Footybite/Sportsurge/Streameast: "THANK YOU" (table links to provider)
      const looksLikeWatch =
        lowerText.includes("watch") ||
        lowerText.includes("stream") ||
        lowerText.includes("live") ||
        lowerText.includes("thank you");

      // Also accept links inside a table row (stream provider table) even if text is short/numbered
      const inTableRow = $(el).closest("tr").length > 0;
      if (!looksLikeWatch && !inTableRow) return;
      if (!looksLikeWatch && inTableRow && (lowerText.length < 2 || /^[\d\s\-]+$/.test(lowerText))) return;

      // Try to extract a provider/label and language from same table row
      let label = text;
      let language: string | null = parseLanguageFromText(lowerText);
      const row = $(el).closest("tr");
      if (row.length) {
        const firstCellText = row
          .find("td")
          .first()
          .text()
          .trim()
          .replace(/\s+/g, " ");
        if (firstCellText && (!label || label.length < 3)) label = firstCellText;
        if (!language) {
          row.find("td").each((_, td) => {
            const cellText = $(td).text().trim();
            const parsed = parseLanguageFromText(cellText);
            if (parsed) {
              language = parsed;
              return false;
            }
          });
        }
      }
      if (!label) label = full;
      if (!language) language = parseLanguageFromText(label);
      let ads = 99;
      if (row.length) ads = parseAdsFromRow($, row);

      if (!linkMap.has(full)) {
        linkMap.set(full, { label, language, ads });
      }
    });

    // Prefer links with 1 ad, then 2, then 3 (working sites often show "1" in Ads column)
    const detailEntries = Array.from(linkMap.entries())
      .sort((a, b) => a[1].ads - b[1].ads)
      .slice(0, 40);

    const allEmbeds: EmbedItem[] = [];

    for (const [detailUrl, { label, language }] of detailEntries) {
      try {
        const detailHtml = await safeFetch(detailUrl);
        const $detail = cheerio.load(detailHtml);

        const titleText = ($detail("title").first().text() || "").trim();
        let matchTitle: string | null = null;
        let leagueName: string | null = null;

        if (titleText) {
          const m =
            titleText.match(/(.+?)\s+vs\.?\s+(.+?)(?:\s+[-–|]|\s+Live|$)/i) ||
            titleText.match(/(.+?)\s+vs\.?\s+(.+)/i);
          if (m) {
            const home = m[1].trim();
            const away = m[2]
              .trim()
              .replace(/\s+Live\s+stream.*$/i, "")
              .replace(/\s+Live\s*$/i, "")
              .trim();
            if (home && away) {
              matchTitle = `${home} vs ${away}`;
            }
          }

          const lowerTitle = titleText.toLowerCase();
          if (lowerTitle.includes("champions league") || lowerTitle.includes("ucl")) {
            leagueName = "UEFA Champions League";
          } else if (lowerTitle.includes("premier league") || lowerTitle.includes("epl")) {
            leagueName = "Premier League";
          } else if (lowerTitle.includes("la liga") || lowerTitle.includes("laliga")) {
            leagueName = "La Liga";
          } else if (lowerTitle.includes("bundesliga")) {
            leagueName = "Bundesliga";
          } else if (lowerTitle.includes("serie a")) {
            leagueName = "Serie A";
          } else if (lowerTitle.includes("ligue 1")) {
            leagueName = "Ligue 1";
          } else if (lowerTitle.includes("europa league")) {
            leagueName = "Europa League";
          }
        }

        let embedUrl = parseStreamIframeFromHtml(detailHtml, detailUrl) ?? null;

        // Fallback: Sportsurge/Streameast detail pages (e.g. totalsportek777) often load iframe via JS.
        // Use the detail page URL as embed so the iframe loads that page; many work as full-page player.
        if (!embedUrl && !isInvalidEmbedUrl(detailUrl)) {
          try {
            const u = new URL(detailUrl);
            const path = (u.pathname || "/").toLowerCase();
            if (
              path !== "/" &&
              path !== "" &&
              !/^\/(news|article|blog|register|login|signup|rules)/i.test(path)
            ) {
              embedUrl = detailUrl;
            }
          } catch {
            // ignore
          }
        }

        // Hard filter obviously non-stream / nav embeds:
        if (embedUrl && indexHost) {
          try {
            const u = new URL(embedUrl);
            const host = u.hostname.toLowerCase();
            const path = (u.pathname || "/").toLowerCase();

            if (host === indexHost) {
              embedUrl = null;
            } else if (
              /\/(register|login|sign[-]?up|rules|privacy|terms|home|index)/i.test(
                path
              )
            ) {
              embedUrl = null;
            } else if (/^\/(news|article|blog|category)\//.test(path) || path.startsWith("/news")) {
              embedUrl = null;
            }
          } catch {
            embedUrl = null;
          }
        }

        // Never use detail pages that are clearly news/articles (safety net)
        try {
          const detailPath = new URL(detailUrl).pathname.toLowerCase();
          if (/^\/(news|article|blog|category)\//.test(detailPath) || detailPath.startsWith("/news")) {
            continue;
          }
        } catch {
          // ignore
        }

        if (!embedUrl) continue;

        allEmbeds.push({
          label,
          detailUrl,
          embedUrl,
          matchTitle,
          leagueName,
          language: language ?? null,
        });
      } catch {
        // ignore failures for this detailUrl
      }
    }

    // Deduplicate by embedUrl, drop any news/article URLs, keep only first 4
    const seen = new Set<string>();
    const embeds: EmbedItem[] = [];
    const isNewsOrArticle = (url: string) => {
      try {
        const path = new URL(url).pathname.toLowerCase();
        return /^\/(news|article|blog|category)\//.test(path) || path.startsWith("/news");
      } catch {
        return true;
      }
    };
    for (const item of allEmbeds) {
      if (isNewsOrArticle(item.embedUrl) || isNewsOrArticle(item.detailUrl)) continue;
      if (seen.has(item.embedUrl)) continue;
      seen.add(item.embedUrl);
      embeds.push(item);
      if (embeds.length >= 4) break;
    }

    const res: ApiResponse = { ok: true, indexUrl, embeds };
    return Response.json(res);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const res: ApiResponse = { ok: false, error: msg };
    return Response.json(res, { status: 500 });
  }
}

