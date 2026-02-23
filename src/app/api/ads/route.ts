import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Ad from "@/lib/models/Ad";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const position = searchParams.get("position");
    const filter: { active?: boolean; position?: string } = { active: true };
    if (position) filter.position = position;
    const ads = await Ad.find(filter).lean();
    return NextResponse.json(ads.map((a) => ({ ...a, id: a._id?.toString() })));
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
    const { position, code, name, active } = body;
    if (!position || code === undefined) {
      return NextResponse.json({ error: "position and code required" }, { status: 400 });
    }
    const ad = await Ad.create({
      position,
      code: code || "",
      name: name || "",
      active: active !== false,
    });
    return NextResponse.json({ ...ad.toObject(), id: ad._id.toString() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
