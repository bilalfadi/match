import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, comparePassword, countUsers, createUser } from "@/lib/data/users";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    let user = await findUserByEmail(email);

    // Bootstrap first admin user automatically (project-file storage).
    // If there are no users yet, allow login with ADMIN_EMAIL / ADMIN_PASSWORD once.
    if (!user) {
      const total = await countUsers();
      const envUser = process.env.ADMIN_EMAIL;
      const envPass = process.env.ADMIN_PASSWORD;
      if (total === 0 && envUser && envPass && email === envUser && password === envPass) {
        user = await createUser({ email: envUser, password: envPass, role: "admin" });
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const match = await comparePassword(user, password);
    if (!match) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const token = signToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });
    return NextResponse.json({ token, user: { email: user.email, role: user.role } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
