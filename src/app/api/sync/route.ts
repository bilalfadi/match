import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync";

export const dynamic = "force-dynamic";

/** GET: run sync from SYNC_SOURCE_URL and update matches (sync-sourced only). */
export async function GET() {
  const result = await runSync();
  if (result.error) {
    return NextResponse.json(
      { ok: false, synced: 0, error: result.error },
      { status: 200 }
    );
  }
  return NextResponse.json({ ok: true, synced: result.synced });
}
