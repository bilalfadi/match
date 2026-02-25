import { NextRequest, NextResponse } from "next/server";
import { findAds, createAd } from "@/lib/data/ads";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const position = searchParams.get("position");
    const admin = await getAdminFromRequest(req);
    const ads = await findAds({
      position: position ?? undefined,
      activeOnly: !admin,
    });
    return NextResponse.json(ads.map((a) => ({ ...a, id: a._id })));
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
    const { position, code, name, active } = body;
    if (!position || code === undefined) {
      return NextResponse.json({ error: "position and code required" }, { status: 400 });
    }
    const ad = await createAd({
      position,
      code: code || "",
      name: name || "",
      active: active !== false,
    });
    return NextResponse.json({ ...ad, id: ad._id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
