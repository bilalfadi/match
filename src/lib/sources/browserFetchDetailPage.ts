/**
 * Fetch detail page with Puppeteer so JavaScript runs and iframe src is set.
 * Use when static fetch returns no valid embed (iframe loaded by JS).
 */

import {
  isInvalidEmbedUrl,
  isNonStreamEmbedUrl,
  isListingOrNavUrl,
} from "./parseStreamIframeFromHtml";

// Extract stream URLs from raw HTML (same logic as parseStreamIframeFromHtml)
const STREAM_HOST_PATTERNS = [
  /https?:\/\/[^\s"'<>)\]]*givemereddit[^\s"'<>)\]]*/gi,
  /https?:\/\/[^\s"'<>)\]]*gooz\.aapmains\.net[^\s"'<>)\]]*/gi,
  /https?:\/\/[^\s"'<>)\]]*hesgoal[^\s"'<>)\]]*/gi,
  /https?:\/\/[^\s"'<>)\]]*stream[^\s"'<>)\]]*\.(?:com|net|io|tv)[^\s"'<>)\]]*/gi,
];

function extractStreamUrlsFromRawHtml(html: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const re of STREAM_HOST_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const u = m[0].replace(/["')\]\s].*$/i, "").trim();
      if (u && !seen.has(u)) {
        seen.add(u);
        out.push(u);
      }
    }
  }
  return out;
}

const BROWSER_TIMEOUT_MS = 25000;
const WAIT_AFTER_LOAD_MS = 6000;

/** URLs that look like stream embeds (from network or DOM). */
function isStreamLikeRequestUrl(url: string): boolean {
  const u = url.toLowerCase();
  if (u.includes("givemereddit") || u.includes("gooz") || u.includes("hesgoal")) return true;
  if (u.includes("stream") && (u.endsWith(".html") || u.includes("/embed") || u.includes("/player"))) return true;
  if (u.includes(".m3u8") || u.includes("streamapi")) return true;
  return false;
}

function pickFirstValidEmbed(candidates: string[], detailUrl: string): string | null {
  for (const src of candidates) {
    if (!src || !src.trim()) continue;
    let full: string;
    try {
      full = new URL(src, detailUrl).href;
    } catch {
      continue;
    }
    if (isInvalidEmbedUrl(full)) continue;
    if (isNonStreamEmbedUrl(full)) continue;
    if (isListingOrNavUrl(full, detailUrl)) continue;
    return full;
  }
  return null;
}

/**
 * Open detailUrl in headless browser, collect stream URLs from network + DOM,
 * return first URL that passes our embed filters.
 */
export async function browserFetchEmbedUrl(
  detailUrl: string
): Promise<string | null> {
  let puppeteer: typeof import("puppeteer");
  try {
    puppeteer = await import("puppeteer");
  } catch {
    return null;
  }

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  const networkUrls: string[] = [];

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Capture all request URLs (incl. iframe navigations) – stream URL often appears here
    page.on("request", (req) => {
      const url = req.url();
      if (isStreamLikeRequestUrl(url)) networkUrls.push(url);
    });
    page.on("response", (res) => {
      const url = res.url();
      if (isStreamLikeRequestUrl(url)) networkUrls.push(url);
    });

    await page.goto(detailUrl, {
      waitUntil: "networkidle2",
      timeout: BROWSER_TIMEOUT_MS,
    });
    await new Promise((r) => setTimeout(r, WAIT_AFTER_LOAD_MS));

    // Click common "Watch" / "Play" links to trigger stream load
    try {
      const watchLink = await page.$('a[href*="stream"], a[href*="watch"], a[href*="embed"], [data-stream]');
      if (watchLink) {
        await watchLink.click();
        await new Promise((r) => setTimeout(r, 3000));
      }
    } catch {}
    try {
      const btns = await page.$$("a, button");
      for (const el of btns.slice(0, 20)) {
        const text = await el.evaluate((n) => (n as HTMLElement).innerText?.toLowerCase() || "");
        if (text.includes("watch") || text.includes("play stream") || text.includes("go to stream") || text.trim() === "play") {
          await el.click().catch(() => {});
          await new Promise((r) => setTimeout(r, 3000));
          break;
        }
      }
    } catch {}

    // Collect iframe src (may be set after click)
    let iframeSrcs: string[] = [];
    for (let i = 0; i < 16; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const srcs = await page.evaluate(() => {
        const iframes = document.querySelectorAll("iframe");
        return Array.from(iframes)
          .map((el) => (el as HTMLIFrameElement).src)
          .filter((s) => s && s.trim() && s !== "javascript:false" && !s.startsWith("javascript:") && s !== "about:blank");
      });
      iframeSrcs = srcs;
      if (iframeSrcs.length > 0) break;
    }

    const pageContent = await page.content();
    const scriptUrls = extractStreamUrlsFromRawHtml(pageContent);
    const allCandidates = [...new Set([...networkUrls, ...iframeSrcs, ...scriptUrls])];
    const result = pickFirstValidEmbed(allCandidates, detailUrl);
    await browser.close();
    browser = null;
    return result;
  } catch {
    return null;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }
}
