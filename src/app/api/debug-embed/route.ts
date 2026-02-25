import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { safeFetch } from "@/lib/sources/safeFetch";
import { parseStreamIframeFromHtml } from "@/lib/sources/parseStreamIframeFromHtml";

/**
 * GET /api/debug-embed?url=... – fetch URL and return what we find (iframes, links, resolved embed).
 * Use to see what the source page returns and why we might get homepage.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !url.startsWith("http")) {
    return NextResponse.json({ error: "Missing or invalid url query (use ?url=https://...)" }, { status: 400 });
  }

  try {
    const html = await safeFetch(url);
    const $ = cheerio.load(html);

    const iframes: { src: string; resolved: string }[] = [];
    $("iframe[src]").each((_, el) => {
      const src = $(el).attr("src");
      if (src) {
        try {
          const resolved = new URL(src, url).href;
          iframes.push({ src, resolved });
        } catch {
          iframes.push({ src, resolved: "(invalid)" });
        }
      }
    });

    const streamLinks: { href: string; resolved: string; text: string }[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const text = $(el).text().trim().slice(0, 50);
      if (/stream|watch|embed|player|live/i.test(href) || /stream|watch|embed|player|live/i.test(text)) {
        try {
          const resolved = new URL(href, url).href;
          streamLinks.push({ href, resolved, text });
        } catch {
          streamLinks.push({ href, resolved: "(invalid)", text });
        }
      }
    });

    const scriptsPreview: string[] = [];
    $("script").each((_, el) => {
      const content = $(el).html() ?? "";
      if (content.length > 0) {
        const snippet = content.slice(0, 800).replace(/\s+/g, " ");
        scriptsPreview.push(snippet);
      }
    });

    const resolvedEmbed = parseStreamIframeFromHtml(html, url);

    return NextResponse.json({
      url,
      iframesCount: iframes.length,
      iframes,
      streamLinksCount: streamLinks.length,
      streamLinks: streamLinks.slice(0, 20),
      scriptsCount: scriptsPreview.length,
      scriptsPreview: scriptsPreview.slice(0, 3),
      resolvedEmbedUrl: resolvedEmbed ?? "(null)",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message, url }, { status: 500 });
  }
}
