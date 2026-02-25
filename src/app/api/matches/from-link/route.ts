import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { createMatch } from "@/lib/data/matches";
import { parseMatchFromDetailUrl } from "@/lib/sources/parseDetailPage";
import { isInvalidEmbedUrl, isListingOrNavUrl } from "@/lib/sources/parseStreamIframeFromHtml";
import { browserFetchEmbedUrl } from "@/lib/sources/browserFetchDetailPage";

/**
 * POST /api/matches/from-link
 * Body: { detailUrl: string, status?: "LIVE" | "UPCOMING" | "FINISHED", matchTime?: string }
 * Detail page ka link bhejo – team names + embed link usi waqt nikal ke save ho jayega,
 * taake user Watch pe click kare to zyada loading na ho.
 */
export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const detailUrl = body.detailUrl?.trim();
    if (!detailUrl || !detailUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "detailUrl required (e.g. https://streameast.gl/soccer/...)" },
        { status: 400 }
      );
    }

    const parsed = await parseMatchFromDetailUrl(detailUrl);
    let streamUrl = parsed.streamUrl?.trim() || "";

    if (
      !streamUrl ||
      isInvalidEmbedUrl(streamUrl) ||
      isListingOrNavUrl(streamUrl, detailUrl)
    ) {
      const browserEmbed = await browserFetchEmbedUrl(detailUrl);
      if (browserEmbed?.trim()) streamUrl = browserEmbed.trim();
    }

    if (
      !streamUrl ||
      isInvalidEmbedUrl(streamUrl) ||
      isListingOrNavUrl(streamUrl, detailUrl)
    ) {
      return NextResponse.json(
        { error: "Stream link not found. Match was not added." },
        { status: 400 }
      );
    }

    const status = body.status === "LIVE" || body.status === "UPCOMING" || body.status === "FINISHED"
      ? body.status
      : "LIVE";
    const matchTime = body.matchTime
      ? new Date(body.matchTime).toISOString()
      : new Date().toISOString();

    const defaultLogo = "https://ui-avatars.com/api/?name=H&size=64&background=1a1a1a&color=888";
    const match = await createMatch({
      homeTeam: parsed.homeTeam,
      awayTeam: parsed.awayTeam,
      homeLogo: defaultLogo.replace("name=H", "name=" + encodeURIComponent(parsed.homeTeam.slice(0, 1))),
      awayLogo: defaultLogo.replace("name=H", "name=" + encodeURIComponent(parsed.awayTeam.slice(0, 1))),
      status,
      streamUrl: streamUrl || undefined,
      sourceDetailUrl: parsed.sourceDetailUrl,
      matchTime,
      homeScore: 0,
      awayScore: 0,
      source: "manual",
    });

    return NextResponse.json({
      ...match,
      id: match._id,
      embedFound: !!streamUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
