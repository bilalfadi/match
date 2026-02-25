/**
 * Run: node scripts/debug-streameast-page.mjs
 * Fetches streameast detail page and logs all iframes, embed links, and script snippets.
 */
import * as cheerio from "cheerio";

const URL = "https://streameast.gl/soccer/740856/everton-vs-man-united";

async function main() {
  const res = await fetch(URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) {
    console.error("Fetch failed:", res.status, res.statusText);
    return;
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log("=== IFRAMES ===");
  const iframes = [];
  $("iframe[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (src) iframes.push(src);
  });
  console.log("Count:", iframes.length);
  iframes.forEach((src, i) => console.log(i + 1, src));

  console.log("\n=== EMBED / OBJECT / VIDEO ===");
  $("embed[src], object[data], video[source]").each((_, el) => {
    const tag = el.name;
    const src = $(el).attr("src") || $(el).attr("data");
    if (src) console.log(tag, src);
  });

  console.log("\n=== LINKS (stream/watch/embed/player) ===");
  const links = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (/stream|watch|embed|player|live/i.test(href)) links.push(href);
  });
  console.log("Count:", links.length);
  links.slice(0, 15).forEach((href, i) => console.log(i + 1, href));

  console.log("\n=== SCRIPT TAGS (first 600 chars each) ===");
  $("script").each((i, el) => {
    const content = $(el).html() || "";
    if (content.length > 0) {
      const snippet = content.replace(/\s+/g, " ").slice(0, 600);
      console.log("--- Script", i + 1, "---");
      console.log(snippet);
    }
  });

  console.log("\n=== RAW BODY (first 3000 chars) ===");
  const body = $("body").html() || "";
  console.log(body.slice(0, 3000));
}

main().catch((e) => console.error(e));
