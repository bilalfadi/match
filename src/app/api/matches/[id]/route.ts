import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Match from "@/lib/models/Match";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const match = await Match.findById(id).lean();
    if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...match, id: match._id?.toString() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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
    if (body.matchTime) body.matchTime = new Date(body.matchTime);
    const match = await Match.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...match, id: match._id?.toString() });
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
    const match = await Match.findByIdAndDelete(id);
    if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
