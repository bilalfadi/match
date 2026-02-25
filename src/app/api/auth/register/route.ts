import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/data/users";
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
    const user = await createUser({ email, password, role: "admin" });
    return NextResponse.json({ user: { id: user._id, email: user.email } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    if (message === "User already exists") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
