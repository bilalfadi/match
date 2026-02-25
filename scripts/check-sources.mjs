/**
 * Run: node scripts/check-sources.mjs
 * Fetches from all 3 sources and reports match counts.
 */
import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function streameast() {
  try {
    const html = await fetchHtml("https://streameast.gl/soccer");
    const $ = cheerio.load(html);
    const links = [];
    $("a[href*='/soccer/']").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      const path = href.replace(/^\/+/, "").split("/");
      if (path[0] !== "soccer" || path.length < 2) return;
      if (!/^\d+$/.test(path[1])) return;
      links.push($(el).text().trim());
    });
    const live = links.filter((t) => /LIVE|Halftime|\d+'|FT\s*\d/.test(t)).length;
    return { ok: true, listing: links.length, live, sample: links.slice(0, 3) };
  } catch (e) {
    return { ok: false, error: e.message, listing: 0, live: 0 };
  }
}

async function xstreameast() {
  try {
    const html = await fetchHtml("https://xstreameast.com/categories/soccer/");
    const $ = cheerio.load(html);
    const links = [];
    $("a[href*='/match/']").each((_, el) => {
      const href = $(el).attr("href");
      if (!href || !href.includes("/match/")) return;
      const text = $(el).closest("div, article, section, li").text();
      links.push({ href, isLive: /LIVE/i.test(text) });
    });
    const live = links.filter((l) => l.isLive).length;
    return { ok: true, listing: links.length, live, sample: links.slice(0, 3).map((l) => l.href) };
  } catch (e) {
    return { ok: false, error: e.message, listing: 0, live: 0 };
  }
}

const NON_SOCCER = ["nba", "nfl", "nhl", "mlb", "ufc", "mma", "boxing", "basketball", "formula 1", "nascar", "wwe"];

async function livekora() {
  try {
    const html = await fetchHtml("https://www.livekora.vip/");
    const $ = cheerio.load(html);
    const links = [];
    $("a[href^='http']").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      try {
        const u = new URL(href);
        if (u.hostname.includes("livekora.vip")) return;
      } catch {
        return;
      }
      const text = $(el).text().trim();
      if (!text || text.length < 5) return;
      if (!/\d+[\s:–-]\d+/.test(text) && !/\d{1,2}:\d{2}/.test(text)) return;
      const lower = text.toLowerCase();
      if (NON_SOCCER.some((k) => lower.includes(k))) return;
      links.push(text.slice(0, 40));
    });
    const live = links.filter((t) => /جارية|LIVE|\d+'/.test(t) || /\d+:\d+\s*[0-9]/.test(t)).length;
    return { ok: true, listing: links.length, live, sample: links.slice(0, 3) };
  } catch (e) {
    return { ok: false, error: e.message, listing: 0, live: 0 };
  }
}

async function main() {
  console.log("Fetching soccer matches from 3 sources...\n");
  const [s1, s2, s3] = await Promise.all([streameast(), xstreameast(), livekora()]);

  console.log("=== 1. streameast.gl/soccer (soccer only) ===");
  console.log("  Soccer matches (listing):", s1.listing, "| LIVE (approx):", s1.live);
  if (s1.error) console.log("  Error:", s1.error);
  if (s1.sample?.length) console.log("  Sample:", s1.sample);

  console.log("\n=== 2. xstreameast.com/categories/soccer (soccer only) ===");
  console.log("  Soccer matches (listing):", s2.listing, "| LIVE (approx):", s2.live);
  if (s2.error) console.log("  Error:", s2.error);
  if (s2.sample?.length) console.log("  Sample:", s2.sample);

  console.log("\n=== 3. livekora.vip (soccer only, non-soccer filtered) ===");
  console.log("  Soccer matches (listing):", s3.listing, "| LIVE (approx):", s3.live);
  if (s3.error) console.log("  Error:", s3.error);
  if (s3.sample?.length) console.log("  Sample:", s3.sample);

  console.log("\n=== TOTAL SOCCER ===");
  console.log("  Listing:", s1.listing + s2.listing + s3.listing);
  console.log("  LIVE (approx):", s1.live + s2.live + s3.live);
}

main().catch((e) => console.error(e));
