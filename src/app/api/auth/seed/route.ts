import { NextRequest, NextResponse } from "next/server";
import { countUsers, createUser } from "@/lib/data/users";

/**
 * One-time seed: create first admin user if none exist.
 *
 * - GET  /api/auth/seed           → uses ADMIN_EMAIL / ADMIN_PASSWORD from .env
 * - POST /api/auth/seed { email, password } → uses body
 */

async function seedFromEnvOrBody(body: { email?: string; password?: string }) {
  const count = await countUsers();
  if (count > 0) {
    return NextResponse.json(
      { error: "Users already exist. Use admin login or register from an existing admin." },
      { status: 400 }
    );
  }

  const email = body?.email || process.env.ADMIN_EMAIL;
  const password = body?.password || process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Provide email and password in body, or set ADMIN_EMAIL and ADMIN_PASSWORD in .env" },
      { status: 400 }
    );
  }

  const user = await createUser({ email, password, role: "admin" });
  return NextResponse.json({
    message: "First admin user created.",
    user: { id: user._id, email: user.email },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    return await seedFromEnvOrBody({});
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    return await seedFromEnvOrBody(body);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
