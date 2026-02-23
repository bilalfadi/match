import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Match from "@/lib/models/Match";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const filter = status ? { status: status as "LIVE" | "UPCOMING" | "FINISHED" } : {};
    const matches = await Match.find(filter).sort({ matchTime: -1 }).lean();
    return NextResponse.json(
      matches.map((m) => ({ ...m, id: m._id?.toString() }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await dbConnect();
    const body = await req.json();
    const {
      homeTeam,
      awayTeam,
      homeLogo,
      awayLogo,
      status,
      streamUrl,
      matchTime,
      homeScore,
      awayScore,
    } = body;
    if (!homeTeam || !awayTeam || !homeLogo || !awayLogo || !status || !matchTime) {
      return NextResponse.json(
        { error: "homeTeam, awayTeam, homeLogo, awayLogo, status, matchTime required" },
        { status: 400 }
      );
    }
    const match = await Match.create({
      homeTeam,
      awayTeam,
      homeLogo,
      awayLogo,
      status,
      streamUrl: streamUrl || "",
      matchTime: new Date(matchTime),
      homeScore: homeScore ?? 0,
      awayScore: awayScore ?? 0,
    });
    return NextResponse.json({ ...match.toObject(), id: match._id.toString() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
