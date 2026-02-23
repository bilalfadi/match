import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Ad from "@/lib/models/Ad";
import { getAdminFromRequest } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const ad = await Ad.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!ad) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...ad, id: ad._id?.toString() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await dbConnect();
    const { id } = await params;
    const ad = await Ad.findByIdAndDelete(id);
    if (!ad) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
