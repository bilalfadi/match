/**
 * Run: node scripts/debug-index-links.mjs
 * Fetches Sportsurge + Streameast INDEX pages and runs same link-extraction as API.
 * Shows how many URLs we get and which ones, so we can fix the logic.
 */
import * as cheerio from "cheerio";

const INDEX_URLS = [
  "https://sportsurge100.is/Juventus-vs-Galatasaray/62639",
  "https://streameast100.is/Juventus-vs-Galatasaray/62639",
];

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  return res.text();
}

function extractLinks(html, indexUrl) {
  const $ = cheerio.load(html);
  let indexHost = "";
  try {
    indexHost = new URL(indexUrl).hostname.toLowerCase();
  } catch {
    indexHost = "";
  }

  const linkMap = new Map(); // full -> label

  // Sportsurge/Streameast: hidden inputs id="linkk..." contain real stream URLs
  $('input[type="hidden"][id^="linkk"]').each((_, el) => {
    const value = $(el).attr("value");
    if (!value) return;
    let full;
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
    if (row.length) {
      const firstCell = row.find("td").first().text().trim().replace(/\s+/g, " ");
      if (firstCell) label = firstCell;
    }
    if (!linkMap.has(full)) linkMap.set(full, label);
  });

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    let full;
    try {
      full = new URL(href, indexUrl).href;
    } catch {
      return;
    }

    // Same host skip
    if (indexHost) {
      try {
        const linkHost = new URL(full).hostname.toLowerCase();
        if (linkHost === indexHost) return;
      } catch {
        // ignore
      }
    }

    // News/article skip
    try {
      const path = new URL(full).pathname.toLowerCase();
      if (/^\/(news|article|blog|category)\//.test(path) || path.startsWith("/news")) return;
    } catch {
      // ignore
    }

    const text = $(el).text().trim();
    const lowerText = text.toLowerCase();

    const looksLikeWatch =
      lowerText.includes("watch") ||
      lowerText.includes("stream") ||
      lowerText.includes("live") ||
      lowerText.includes("thank you");

    const inTableRow = $(el).closest("tr").length > 0;
    if (!looksLikeWatch && !inTableRow) return;
    if (!looksLikeWatch && inTableRow && (lowerText.length < 2 || /^[\d\s\-]+$/.test(lowerText))) return;

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
        if (firstCellText) label = firstCellText;
      }
    }
    if (!label) label = full;

    if (!linkMap.has(full)) linkMap.set(full, label);
  });

  return Array.from(linkMap.entries());
}

async function main() {
  for (const indexUrl of INDEX_URLS) {
    console.log("\n" + "=".repeat(70));
    console.log("INDEX:", indexUrl);
    console.log("=".repeat(70));

    let html;
    try {
      html = await fetchHtml(indexUrl);
      console.log("HTML length:", html.length);
    } catch (e) {
      console.error("Fetch error:", e.message);
      continue;
    }

    const entries = extractLinks(html, indexUrl);
    console.log("Extracted links (API logic):", entries.length);
    entries.forEach(([url, label], i) => {
      console.log(`${i + 1}. [${label}] ${url}`);
    });

    // ALL links inside <tr> (same-host + external) to see real structure
    const $ = cheerio.load(html);
    let indexHost = "";
    try {
      indexHost = new URL(indexUrl).hostname.toLowerCase();
    } catch {}
    const tableLinksAll = [];
    $("tr a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      let full;
      try {
        full = new URL(href, indexUrl).href;
      } catch {
        return;
      }
      const text = $(el).text().trim();
      const linkHost = (() => {
        try {
          return new URL(full).hostname.toLowerCase();
        } catch {
          return "";
        }
      })();
      const sameHost = linkHost === indexHost;
      tableLinksAll.push({ url: full, text: text.slice(0, 50), sameHost });
    });
    console.log("\nAll links inside <tr> (total):", tableLinksAll.length);
    tableLinksAll.slice(0, 30).forEach(({ url, text, sameHost }, i) => {
      console.log(`  ${i + 1}. [${sameHost ? "SAME" : "EXT"}] "${text}" -> ${url}`);
    });

    // Where do "thank you" / "watch" / stream links appear in raw HTML?
    const lower = html.toLowerCase();
    console.log("\nContains 'thank you':", lower.includes("thank you"));
    console.log("Contains 'watch':", lower.includes("watch"));
    const thankYouPos = lower.indexOf("thank you");
    if (thankYouPos !== -1) {
      const snippet = html.slice(Math.max(0, thankYouPos - 200), thankYouPos + 300);
      console.log("Snippet around 'thank you':", snippet.replace(/\s+/g, " ").slice(0, 400));
    }
    // Count tables and total <a href> on page
    console.log("\nTotal <table>:", $("table").length);
    console.log("Total <a href>:", $("a[href]").length);
    // Links that have watch/stream/live in text
    const watchLike = [];
    $("a[href]").each((_, el) => {
      const t = $(el).text().trim().toLowerCase();
      const h = ($(el).attr("href") || "").toLowerCase();
      if (t.includes("watch") || t.includes("stream") || t.includes("live") || t.includes("thank you") || h.includes("stream")) {
        let full;
        try {
          full = new URL($(el).attr("href"), indexUrl).href;
        } catch {
          return;
        }
        watchLike.push({ text: t.slice(0, 40), url: full });
      }
    });
    console.log("\nLinks with watch/stream/live/thank you in text or href:", watchLike.length);
    watchLike.slice(0, 15).forEach((x, i) => console.log(`  ${i + 1}. "${x.text}" -> ${x.url}`));

    // THANK YOU uses onclick=fun(ID) - no href. Search for that ID or URLs in scripts/data
    const funMatch = html.match(/onclick="fun\((\d+)\)"/);
    if (funMatch) {
      const id = funMatch[1];
      console.log("\nExample THANK YOU id:", id);
      const idPos = html.indexOf(id);
      if (idPos !== -1) {
        const around = html.slice(Math.max(0, idPos - 100), idPos + 200);
        console.log("Context around id:", around.replace(/\s+/g, " ").slice(0, 350));
      }
    }
    // Any script that might contain stream URLs or provider list
    const scriptBlobs = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
    let foundInScript = false;
    for (const blob of scriptBlobs) {
      if (blob.length > 500 && blob.length < 100000 && (blob.includes("http") || blob.includes("url") || blob.includes("stream"))) {
        console.log("\nScript blob (first 800 chars):", blob.slice(0, 800));
        foundInScript = true;
        break;
      }
    }
    if (!foundInScript) console.log("\n(No medium-sized script with http/url/stream found)");
  }
}

main().catch((e) => console.error(e));
