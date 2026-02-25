import { NextRequest, NextResponse } from "next/server";
import { findMatches, createMatch } from "@/lib/data/matches";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as "LIVE" | "UPCOMING" | "FINISHED" | null;
    let matches = await findMatches(status ?? undefined);
    matches = matches.filter((m) => m.source === "manual");
    const isAdmin = !!(await getAdminFromRequest(req));
    if (!isAdmin) {
      // Homepage/schedule: sirf wahi matches jinke paas embed URL hai
      matches = matches.filter((m) => m.streamUrl?.trim());
    }
    return NextResponse.json(matches.map((m) => ({ ...m, id: m._id })));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const {
      homeTeam,
      awayTeam,
      homeLogo,
      awayLogo,
      status,
      streamUrl,
      sourceDetailUrl,
      matchTime,
      homeScore,
      awayScore,
    } = body;
    if (!homeTeam || !awayTeam || !status || !matchTime) {
      return NextResponse.json(
        { error: "homeTeam, awayTeam, status, matchTime required" },
        { status: 400 }
      );
    }
    const defaultLogo = "https://ui-avatars.com/api/?name=H&size=64&background=1a1a1a&color=888";
    const match = await createMatch({
      homeTeam: String(homeTeam).trim(),
      awayTeam: String(awayTeam).trim(),
      homeLogo: (homeLogo && String(homeLogo).trim()) || defaultLogo.replace("name=H", "name=" + encodeURIComponent(String(homeTeam).slice(0, 1))),
      awayLogo: (awayLogo && String(awayLogo).trim()) || defaultLogo.replace("name=H", "name=" + encodeURIComponent(String(awayTeam).slice(0, 1))),
      status,
      streamUrl: streamUrl && String(streamUrl).trim() ? String(streamUrl).trim() : undefined,
      sourceDetailUrl: sourceDetailUrl && String(sourceDetailUrl).trim() ? String(sourceDetailUrl).trim() : undefined,
      matchTime: new Date(matchTime).toISOString(),
      homeScore: homeScore ?? 0,
      awayScore: awayScore ?? 0,
      source: "manual",
    });
    return NextResponse.json({ ...match, id: match._id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
