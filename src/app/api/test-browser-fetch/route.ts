import { NextRequest, NextResponse } from "next/server";
import { browserFetchEmbedUrl } from "@/lib/sources/browserFetchDetailPage";

/**
 * GET /api/test-browser-fetch?url=...
 * Test browser fetch on a detail URL to see if Puppeteer can extract iframe src.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !url.startsWith("http")) {
    return NextResponse.json(
      { error: "Missing or invalid url query (use ?url=https://...)" },
      { status: 400 }
    );
  }

  try {
    const start = Date.now();
    
    // Import puppeteer directly to get debug info
    let puppeteer: typeof import("puppeteer");
    try {
      puppeteer = await import("puppeteer");
    } catch {
      return NextResponse.json({
        error: "Puppeteer not available",
        url,
        success: false,
      });
    }

    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
    const debug: { iframesFound: number; iframeSrcs: string[]; errors: string[] } = {
      iframesFound: 0,
      iframeSrcs: [],
      errors: [],
    };

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      });
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      
      await new Promise((r) => setTimeout(r, 5000)); // Wait longer
      
      const iframeSrcs = await page.evaluate(() => {
        const iframes = document.querySelectorAll("iframe[src]");
        return Array.from(iframes).map((el) => (el as HTMLIFrameElement).src);
      });
      
      const allIframes = await page.evaluate(() => {
        const iframes = document.querySelectorAll("iframe");
        return Array.from(iframes).map((el) => ({
          src: (el as HTMLIFrameElement).src || "",
          id: (el as HTMLIFrameElement).id || "",
          className: (el as HTMLIFrameElement).className || "",
        }));
      });
      
      debug.iframesFound = allIframes.length;
      debug.iframeSrcs = iframeSrcs;
      
      await browser.close();
      browser = null;
      
      const elapsed = Date.now() - start;
      
      // Apply filters to see which ones pass
      const filtered: string[] = [];
      for (const src of iframeSrcs) {
        if (!src || !src.trim()) continue;
        let full: string;
        try {
          full = new URL(src, url).href;
        } catch {
          continue;
        }
        const { isInvalidEmbedUrl, isNonStreamEmbedUrl, isListingOrNavUrl } = await import("@/lib/sources/parseStreamIframeFromHtml");
        if (!isInvalidEmbedUrl(full) && !isNonStreamEmbedUrl(full) && !isListingOrNavUrl(full, url)) {
          filtered.push(full);
        }
      }

      return NextResponse.json({
        url,
        success: filtered.length > 0,
        embedUrl: filtered[0] || null,
        elapsedMs: elapsed,
        debug: {
          ...debug,
          allIframes,
          filteredUrls: filtered,
        },
        message: filtered.length > 0
          ? "✅ Browser fetch found embed URL"
          : `❌ Found ${debug.iframesFound} iframes but none passed filters. Srcs: ${debug.iframeSrcs.join(", ") || "none"}`,
      });
    } catch (e) {
      debug.errors.push(e instanceof Error ? e.message : String(e));
      if (browser) {
        try {
          await browser.close();
        } catch {}
      }
      throw e;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        error: message,
        url,
        success: false,
      },
      { status: 500 }
    );
  }
}
