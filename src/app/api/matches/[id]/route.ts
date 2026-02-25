import { NextRequest, NextResponse } from "next/server";
import { findMatchById, updateMatch, deleteMatch } from "@/lib/data/matches";
import { getAdminFromRequest } from "@/lib/auth";
import { safeFetch } from "@/lib/sources/safeFetch";
import {
  parseStreamIframeFromHtml,
  isAcceptableEmbedUrl,
} from "@/lib/sources/parseStreamIframeFromHtml";
import { browserFetchEmbedUrl } from "@/lib/sources/browserFetchDetailPage";

/**
 * Resolve stream URL only when DB mein na ho ya invalid ho.
 * Jab admin add karte waqt embed save kar chuka hota hai to yahan resolve nahi karte – taake user Watch pe zyada loading na ho.
 */
async function resolveStreamUrlFromSource(match: {
  streamUrl?: string;
  sourceDetailUrl?: string;
}): Promise<string> {
  const detailUrl = match.sourceDetailUrl?.trim();
  const stored = match.streamUrl?.trim() ?? "";

  if (stored && detailUrl && isAcceptableEmbedUrl(stored, detailUrl)) return stored;

  if (detailUrl) {
    try {
      const html = await safeFetch(detailUrl);
      const embedUrl = parseStreamIframeFromHtml(html, detailUrl);
      if (embedUrl && isAcceptableEmbedUrl(embedUrl, detailUrl)) return embedUrl.trim();
    } catch {
      // static fetch failed; try browser below
    }
    try {
      const browserEmbed = await browserFetchEmbedUrl(detailUrl);
      if (browserEmbed && isAcceptableEmbedUrl(browserEmbed, detailUrl)) return browserEmbed.trim();
    } catch {
      // fall back to stored
    }
  }
  return isAcceptableEmbedUrl(stored, detailUrl) ? stored : "";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const match = await findMatchById(id);
    if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const streamUrl = await resolveStreamUrlFromSource(match);
    return NextResponse.json({ ...match, id: match._id, streamUrl });
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
    const { id } = await params;
    const body = await req.json();
    if (body.matchTime) body.matchTime = new Date(body.matchTime).toISOString();
    const match = await updateMatch(id, body);
    if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...match, id: match._id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const ok = await deleteMatch(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
