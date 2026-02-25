import { NextResponse } from "next/server";
import { fetchStreameastGlMatches } from "@/lib/sources/fetchStreameastGl";
import { fetchXstreameastMatches } from "@/lib/sources/fetchXstreameast";
import { fetchLivekoraMatches } from "@/lib/sources/fetchLivekora";
import { fetchLiveMatchesWithEmbed } from "@/lib/sources";

type SourceKey = "streameast" | "xstreameast" | "livekora";

interface SourceStatus {
  ok: boolean;
  listingCount: number;
  liveCount: number;
  withEmbedCount: number;
  error?: string;
  sampleTitles?: string[];
}

/**
 * GET /api/debug-sources – check kaha se data aa raha, kaha se nahi, aur kyun.
 * Returns per-source: listing count, LIVE count, withEmbed count, and any error.
 */
export async function GET() {
  const result: Record<SourceKey, SourceStatus> = {
    streameast: { ok: false, listingCount: 0, liveCount: 0, withEmbedCount: 0 },
    xstreameast: { ok: false, listingCount: 0, liveCount: 0, withEmbedCount: 0 },
    livekora: { ok: false, listingCount: 0, liveCount: 0, withEmbedCount: 0 },
  };

  const withEmbedBySource: Record<SourceKey, number> = {
    streameast: 0,
    xstreameast: 0,
    livekora: 0,
  };

  try {
    const [streameastList, xstreameastList, livekoraList] = await Promise.all([
      fetchStreameastGlMatches()
        .then((list) => ({ ok: true as const, list }))
        .catch((e: unknown) => ({
          ok: false as const,
          list: [] as Awaited<ReturnType<typeof fetchStreameastGlMatches>>,
          error: e instanceof Error ? e.message : String(e),
        })),
      fetchXstreameastMatches()
        .then((list) => ({ ok: true as const, list }))
        .catch((e: unknown) => ({
          ok: false as const,
          list: [] as Awaited<ReturnType<typeof fetchXstreameastMatches>>,
          error: e instanceof Error ? e.message : String(e),
        })),
      fetchLivekoraMatches()
        .then((list) => ({ ok: true as const, list }))
        .catch((e: unknown) => ({
          ok: false as const,
          list: [] as Awaited<ReturnType<typeof fetchLivekoraMatches>>,
          error: e instanceof Error ? e.message : String(e),
        })),
    ]);

    result.streameast = {
      ok: streameastList.ok,
      listingCount: streameastList.list.length,
      liveCount: streameastList.list.filter((m) => m.status === "LIVE").length,
      withEmbedCount: 0,
      error: !streameastList.ok ? (streameastList as { error?: string }).error : undefined,
      sampleTitles: streameastList.list.slice(0, 3).map((m) => m.title),
    };

    result.xstreameast = {
      ok: xstreameastList.ok,
      listingCount: xstreameastList.list.length,
      liveCount: xstreameastList.list.filter((m) => m.status === "LIVE").length,
      withEmbedCount: 0,
      error: !xstreameastList.ok ? (xstreameastList as { error?: string }).error : undefined,
      sampleTitles: xstreameastList.list.slice(0, 3).map((m) => m.title),
    };

    result.livekora = {
      ok: livekoraList.ok,
      listingCount: livekoraList.list.length,
      liveCount: livekoraList.list.filter((m) => m.status === "LIVE").length,
      withEmbedCount: 0,
      error: !livekoraList.ok ? (livekoraList as { error?: string }).error : undefined,
      sampleTitles: livekoraList.list.slice(0, 3).map((m) => m.title),
    };

    const withEmbed = await fetchLiveMatchesWithEmbed();
    for (const m of withEmbed) {
      const key = m.source as SourceKey;
      if (key in withEmbedBySource) withEmbedBySource[key]++;
    }

    result.streameast.withEmbedCount = withEmbedBySource.streameast;
    result.xstreameast.withEmbedCount = withEmbedBySource.xstreameast;
    result.livekora.withEmbedCount = withEmbedBySource.livekora;

    function reason(s: SourceStatus): string | undefined {
      if (s.error) return s.error;
      if (s.listingCount === 0) return "Listing fetch se koi match nahi mila (page structure change ya block).";
      if (s.liveCount === 0) return "Listing mili lekin koi LIVE match nahi.";
      if (s.withEmbedCount === 0)
        return "LIVE mila lekin detail page se valid embed URL nahi nikla (homepage/listing reject).";
      return undefined;
    }

    return NextResponse.json({
      summary: {
        totalListing:
          result.streameast.listingCount + result.xstreameast.listingCount + result.livekora.listingCount,
        totalLive:
          result.streameast.liveCount + result.xstreameast.liveCount + result.livekora.liveCount,
        totalWithEmbed: withEmbed.length,
      },
      sources: result,
      reasons: {
        streameast: reason(result.streameast),
        xstreameast: reason(result.xstreameast),
        livekora: reason(result.livekora),
      },
      message: [
        result.streameast.error && `streameast: ${result.streameast.error}`,
        result.xstreameast.error && `xstreameast: ${result.xstreameast.error}`,
        result.livekora.error && `livekora: ${result.livekora.error}`,
      ]
        .filter(Boolean)
        .join(" | ") || undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message, sources: result }, { status: 500 });
  }
}
