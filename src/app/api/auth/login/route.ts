import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const match = await (user as { comparePassword: (c: string) => Promise<boolean> }).comparePassword(password);
    if (!match) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    return NextResponse.json({ token, user: { email: user.email, role: user.role } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
