/**
 * Run:
 *   node scripts/debug-totalsportek-page.mjs "<detail-page-url>"
 *
 * Example:
 *   node scripts/debug-totalsportek-page.mjs "https://live.totalsportek777.com/Atalanta-vs-Borussia-Dortmund/62638"
 *
 * Ye script given URL se HTML fetch karega,
 * table/links parse karega aur "Watch" wale buttons ke actual href
 * (detail/stream links) console pe print karega.
 */

import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  return res.text();
}

async function main() {
  const url =
    process.argv[2] ||
    "https://live.totalsportek777.com/Atalanta-vs-Borussia-Dortmund/62638";

  console.log("Fetching Totalsportek page:", url, "\n");

  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const results = [];

  // Common pattern: "Watch" buttons inside table rows
  $("a").each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    if (!text || !text.includes("watch")) return;

    const href = $(el).attr("href");
    if (!href) return;

    // Try to get "streamer" / label from same row (if in table)
    let label = "";
    const row = $(el).closest("tr");
    if (row.length) {
      const tds = row.find("td");
      if (tds.length) {
        label = $(tds[0]).text().trim().replace(/\s+/g, " ");
      }
    }

    let full;
    try {
      full = new URL(href, url).href;
    } catch {
      full = href;
    }

    results.push({
      label: label || text || "watch",
      href: full,
    });
  });

  console.log("Found watch/detail links:", results.length);
  if (!results.length) {
    console.log(
      "Koi 'Watch' links nahi mile. Ho sakta hai page JS se links load karta ho (us case mein Puppeteer/browser chahiye)."
    );
    return;
  }

  results.forEach((r, i) => {
    console.log(
      `${i + 1}. ${r.label} -> ${r.href}`
    );
  });
}

main().catch((e) => {
  console.error("Error:", e.message || e);
});

