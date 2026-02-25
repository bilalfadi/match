import * as cheerio from "cheerio";

function isHomepagePath(pathname: string): boolean {
  const p = (pathname || "/").replace(/\/$/, "") || "/";
  return p === "/" || p === "";
}

/** True if URL is homepage or invalid – never use as iframe embed. */
export function isInvalidEmbedUrl(url: string): boolean {
  if (!url || !url.trim()) return true;
  const u = url.trim().toLowerCase();
  if (u === "about:blank" || u === "about:srcdoc" || u.startsWith("javascript:") || u.startsWith("data:"))
    return true;
  try {
    const parsed = new URL(url);
    const p = (parsed.pathname || "/").replace(/\/$/, "") || "/";
    if (p === "/" || p === "") return true;
    if (parsed.protocol === "about:" || parsed.protocol === "javascript:") return true;
    return false;
  } catch {
    return true;
  }
}

/** True if URL is acceptable as embed (not homepage, not listing). */
export function isAcceptableEmbedUrl(url: string, detailUrl?: string): boolean {
  if (!url || !url.trim()) return false;
  if (isInvalidEmbedUrl(url)) return false;
  if (detailUrl && isListingOrNavUrl(url, detailUrl)) return false;
  return true;
}

/**
 * Reject listing/nav/match-detail pages – not real stream embed.
 * Same-origin URL is only accepted if path clearly looks like embed/player (e.g. /embed/, /player/).
 */
export function isListingOrNavUrl(url: string, detailUrl: string): boolean {
  try {
    const u = new URL(url, detailUrl);
    const path = (u.pathname || "/").toLowerCase();
    if (path.includes("/categories/") || path.includes("/category/")) return true;
    const d = new URL(detailUrl);
    if (u.origin !== d.origin) return false;
    const pathNorm = (u.pathname || "/").replace(/\/$/, "") || "/";
    const lower = pathNorm.toLowerCase();
    const hasEmbedLikePath = /(\/embed\/|\/player\/|\/watch\/|\/stream\/|\/live\/)/i.test(pathNorm);
    if (hasEmbedLikePath) return false;
    if (lower === "/" || lower === "" || lower === "/soccer" || lower === "/football") return true;
    if (lower.startsWith("/soccer") || lower.includes("/categories/") || lower.includes("/category/")) return true;
    if (lower.includes("/team/") || lower.includes("/standings/") || lower.includes("/news")) return true;
    return true;
  } catch {
    return true;
  }
}

function isSamePageUrl(detailUrl: string, candidate: string): boolean {
  try {
    const d = new URL(detailUrl);
    const c = new URL(candidate, detailUrl);
    return d.origin === c.origin && d.pathname === c.pathname;
  } catch {
    return false;
  }
}

/** Skip known non-stream embeds (live chat, social). Prefer actual stream iframe. */
export function isNonStreamEmbedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path = (u.pathname || "") + u.search;
    if (host.includes("studio.youtube.com") || path.includes("live_chat")) return true;
    if (host.includes("facebook.com") || host.includes("twitter.com") || host.includes("x.com")) return true;
    return false;
  } catch {
    return false;
  }
}

function isStreamLikeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    const host = u.hostname.toLowerCase();
    const streamKeywords = [
      "hesgoal",
      "crack-streams",
      "streamapi",
      "stream",
      "watch",
      "player",
      "embed",
      "gooz.aapmains.net/new-stream-embed",
      "givemereddit",
      "givemereddit.zip",
    ];
    if (path.includes("gooz.aapmains.net/new-stream-embed")) return true;
    if (isHomepagePath(path)) return false;
    const combined = path + " " + host;
    return streamKeywords.some((k) => combined.includes(k));
  } catch {
    return false;
  }
}

function extractUrlsFromScripts(html: string): string[] {
  const urls: string[] = [];
  const regex =
    /(?:src|url|embed|stream)\s*[=:]\s*["']([^"']+)["']|(?:src|url|embed)\s*[=:]\s*([^\s,}\]"']+)|(https?:\/\/[^\s"'<>)\]]+\.m3u8)|(\/embed\/[^\s"'<>)\]]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    const u = (m[1] ?? m[2] ?? m[3] ?? m[4] ?? "").trim();
    if (u && (u.startsWith("http") || u.startsWith("//") || u.startsWith("/"))) urls.push(u);
  }
  return urls;
}

/** Known stream embed hosts – scan full HTML when iframes are empty or about:blank. */
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
      let u = m[0].replace(/["')\]\s].*$/i, "").trim();
      if (u && !seen.has(u)) {
        seen.add(u);
        out.push(u);
      }
    }
  }
  return out;
}

/**
 * Extract embed/stream URL from detail page HTML.
 * Rejects homepage and same-page URLs.
 */
export function parseStreamIframeFromHtml(html: string, detailUrl: string): string | null {
  const $ = cheerio.load(html);

  const resolve = (href: string): string => {
    if (!href || !href.trim()) return "";
    try {
      return new URL(href, detailUrl).href;
    } catch {
      return "";
    }
  };

  const candidates: { url: string; priority: number }[] = [];

  // Priority 1: iframe with gooz embed
  $("iframe[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    const full = resolve(src);
    if (full && full.includes("gooz.aapmains.net/new-stream-embed")) {
      candidates.push({ url: full, priority: 1 });
    }
  });

  // Priority 1.2: any other iframe[src] that is not homepage (real stream page embeds)
  $("iframe[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    const full = resolve(src);
    if (!full || isHomepagePath(new URL(full, detailUrl).pathname)) return;
    if (isSamePageUrl(detailUrl, full)) return;
    if (full.includes("gooz.aapmains.net/new-stream-embed")) return;
    candidates.push({ url: full, priority: 1.2 });
  });

  // Priority 1.5: iframe/a/source/video/embed/object with stream-like URL
  $("iframe[src], a[href], source[src], video[src], embed[src], object[data]").each((_, el) => {
    const tag = $(el).prop("tagName")?.toString().toLowerCase() ?? "";
    let u = "";
    if (tag === "iframe" || tag === "source" || tag === "video" || tag === "embed") u = $(el).attr("src") ?? "";
    if (tag === "object") u = $(el).attr("data") ?? "";
    if (tag === "a") u = $(el).attr("href") ?? "";
    const full = resolve(u);
    if (!full || isHomepagePath(new URL(full, detailUrl).pathname)) return;
    if (isStreamLikeUrl(full)) candidates.push({ url: full, priority: 1.5 });
  });

  // Priority 2: script tags
  extractUrlsFromScripts(html).forEach((u) => {
    const full = u.startsWith("http") ? u : resolve(u);
    if (full && isStreamLikeUrl(full) && !isHomepagePath(new URL(full, detailUrl).pathname)) {
      candidates.push({ url: full, priority: 2 });
    }
  });

  // Priority 1.8: known stream domains in raw HTML (when iframe empty or about:blank)
  extractStreamUrlsFromRawHtml(html).forEach((u) => {
    const full = u.startsWith("http") ? u : resolve(u);
    if (full && !isInvalidEmbedUrl(full) && !isHomepagePath(new URL(full, detailUrl).pathname)) {
      candidates.push({ url: full, priority: 1.8 });
    }
  });

  // Priority 3: data-src, data-url, data-embed, data-stream
  $("[data-src], [data-url], [data-embed], [data-stream]").each((_, el) => {
    const u =
      $(el).attr("data-src") ?? $(el).attr("data-url") ?? $(el).attr("data-embed") ?? $(el).attr("data-stream") ?? "";
    const full = resolve(u);
    if (full && isStreamLikeUrl(full) && !isHomepagePath(new URL(full, detailUrl).pathname)) {
      candidates.push({ url: full, priority: 3 });
    }
  });

  // Priority 5: a[href*='stream'|'watch'|'live'|'embed']
  $("a[href*='stream'], a[href*='watch'], a[href*='live'], a[href*='embed']").each((_, el) => {
    const u = $(el).attr("href") ?? "";
    const full = resolve(u);
    if (!full || isHomepagePath(new URL(full, detailUrl).pathname)) return;
    candidates.push({ url: full, priority: 5 });
  });

  for (const p of [1, 1.2, 1.5, 1.8, 2, 3, 5]) {
    const byP = candidates.filter((c) => c.priority === p);
    for (const { url } of byP) {
      if (isSamePageUrl(detailUrl, url)) continue;
      if (isNonStreamEmbedUrl(url)) continue;
      try {
        if (isHomepagePath(new URL(url, detailUrl).pathname)) continue;
      } catch {
        continue;
      }
      if (isInvalidEmbedUrl(url)) continue;
      if (isListingOrNavUrl(url, detailUrl)) continue;
      return url;
    }
  }
  return null;
}
