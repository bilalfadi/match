/**
 * Check if we extract language from index page (same logic as API).
 * Run: node scripts/check-language-extraction.mjs
 */
import * as cheerio from "cheerio";

const LANGUAGE_WORDS = /(english|german|italian|turkish|spanish|french|portuguese|arabic)\b/i;
function parseLanguageFromText(text) {
  const m = text.match(LANGUAGE_WORDS);
  return m ? m[1].toLowerCase() : null;
}
function parseAdsFromLabel(text) {
  const m = text.match(/\b([123])\b/);
  return m ? parseInt(m[1], 10) : 99;
}
function parseAdsFromRow($, row) {
  let ads = 99;
  const tds = row.find("td");
  for (let i = 0; i < tds.length; i++) {
    const t = tds.eq(i).text().trim();
    if (t === "1" || t === "2" || t === "3") {
      ads = parseInt(t, 10);
      break;
    }
  }
  return ads;
}

const INDEX_URL = "https://totalsportek.army/game/juventus-vs-galatasaray/62639/";

async function main() {
  console.log("Fetching:", INDEX_URL);
  const res = await fetch(INDEX_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) {
    console.log("Fetch failed:", res.status);
    return;
  }
  const html = await res.text();
  const $ = cheerio.load(html);
  const indexHost = new URL(INDEX_URL).hostname.toLowerCase();
  const linkMap = new Map(); // full -> { label, language, ads }

  // Anchor links (Totalsportek style)
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    let full;
    try {
      full = new URL(href, INDEX_URL).href;
    } catch {
      return;
    }
    try {
      if (new URL(full).hostname.toLowerCase() === indexHost) return;
    } catch {
      return;
    }
    try {
      const path = new URL(full).pathname.toLowerCase();
      if (/^\/(news|article|blog|category)\//.test(path) || path.startsWith("/news")) return;
    } catch {
      return;
    }
    const text = $(el).text().trim();
    const lowerText = text.toLowerCase();
    const looksLikeWatch =
      lowerText.includes("watch") ||
      lowerText.includes("stream") ||
      lowerText.includes("live") ||
      lowerText.includes("thank you");
    const row = $(el).closest("tr");
    const inTableRow = row.length > 0;
    if (!looksLikeWatch && !inTableRow) return;
    if (!looksLikeWatch && inTableRow && (lowerText.length < 2 || /^[\d\s\-]+$/.test(lowerText))) return;

    let label = text;
    let language = parseLanguageFromText(lowerText);
    if (row.length) {
      const firstCell = row.find("td").first().text().trim().replace(/\s+/g, " ");
      if (firstCell && (!label || label.length < 3)) label = firstCell;
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
    const ads = row.length ? parseAdsFromRow($, row) : parseAdsFromLabel(label);
    if (!linkMap.has(full)) linkMap.set(full, { label, language, ads });
  });

  const entries = Array.from(linkMap.entries())
    .sort((a, b) => {
      if (a[1].ads !== b[1].ads) return a[1].ads - b[1].ads;
      const aHasLang = a[1].language != null && a[1].language !== "";
      const bHasLang = b[1].language != null && b[1].language !== "";
      return aHasLang === bHasLang ? 0 : aHasLang ? -1 : 1;
    })
    .slice(0, 12);
  console.log("\nFirst 12 links (sort: 1-ad first, then with language):");
  entries.forEach(([url, info], i) => {
    console.log(`${i + 1}. ads=${info.ads} language=${JSON.stringify(info.language)} | ${url.slice(0, 52)}...`);
  });
  const withLang = entries.filter(([, info]) => info.language != null && info.language !== "");
  const with1Ad = entries.filter(([, info]) => info.ads === 1);
  console.log("\nSummary: 1-ad:", with1Ad.length, "| with language:", withLang.length, "of", entries.length);
}

main().catch((e) => console.error(e));
