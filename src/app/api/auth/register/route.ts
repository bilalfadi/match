import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { getAdminFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    await dbConnect();
    const exists = await User.findOne({ email });
    if (exists) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }
    const user = await User.create({ email, password, role: "admin" });
    return NextResponse.json({ user: { id: user._id, email: user.email } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
