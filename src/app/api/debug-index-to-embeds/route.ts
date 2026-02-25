import * as cheerio from "cheerio";
import { safeFetch } from "@/lib/sources/safeFetch";
import { parseStreamIframeFromHtml } from "@/lib/sources/parseStreamIframeFromHtml";

type LinkResult = {
  label: string;
  detailUrl: string;
  embedUrl: string | null;
  matchTitle: string | null;
  leagueName: string | null;
};

type ApiResponse =
  | { ok: true; indexUrl: string; links: LinkResult[] }
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

    const linkMap = new Map<string, string>(); // detailUrl -> label

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
      // We only care about outgoing provider/detail URLs.
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

      // Try to extract a provider/label from same table row or surrounding cell
      let label = text;
      if (!label || label.length < 3) {
        const row = $(el).closest("tr");
        if (row.length) {
          const firstCellText = row
            .find("td")
            .first()
            .text()
            .trim()
            .replace(/\s+/g, " ");
          if (firstCellText) {
            label = firstCellText;
          }
        }
      }
      if (!label) {
        label = full;
      }

      if (!linkMap.has(full)) {
        linkMap.set(full, label);
      }
    });

    const detailEntries = Array.from(linkMap.entries()).slice(0, 40); // cap to 40 for safety

    const links: LinkResult[] = [];

    for (const [detailUrl, label] of detailEntries) {
    let embedUrl: string | null = null;
      let matchTitle: string | null = null;
      let leagueName: string | null = null;
      try {
        const detailHtml = await safeFetch(detailUrl);
        const $detail = cheerio.load(detailHtml);

        // Match title from <title> (Everton vs Manchester United ...)
        const titleText = ($detail("title").first().text() || "").trim();
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
        }

        // Very simple league detection from title text
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

        const resolved = parseStreamIframeFromHtml(detailHtml, detailUrl);
        embedUrl = resolved ?? null;

        // Hard filter obviously non-stream / nav embeds:
        // - Same host as index page (e.g. StreamsPortal register/login pages)
        // - Paths like /register, /login, /rules, /privacy, /terms, /home, /index
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
            }
          } catch {
            // if URL is invalid, treat as no embed
            embedUrl = null;
          }
        }
      } catch {
        embedUrl = null;
      }
      links.push({ label, detailUrl, embedUrl, matchTitle, leagueName });
    }

    // Return only entries that actually resolved to an embed URL (stream found)
    const withEmbeds = links.filter((l) => !!l.embedUrl);

    const res: ApiResponse = { ok: true, indexUrl, links: withEmbeds };
    return Response.json(res);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const res: ApiResponse = { ok: false, error: msg };
    return Response.json(res, { status: 500 });
  }
}

