export type SourceId = "streameast" | "xstreameast" | "livekora";

export interface MatchSummary {
  source: SourceId;
  url: string;
  title: string;
  startTime: string;
  status: "LIVE" | "UPCOMING" | "FINISHED";
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
}

/** Encode match to stable id so detail page can resolve URL and embed later. */
export function encodeMatchId(m: { source: string; url: string; title: string; startTime?: string; status?: string }): string {
  const payload = JSON.stringify({
    s: m.source,
    u: m.url,
    t: m.title,
    st: m.startTime ?? "",
    sts: m.status ?? "",
  });
  return Buffer.from(payload, "utf-8").toString("base64url");
}

export function decodeMatchId(id: string): { source: string; url: string; title: string; startTime: string; status: string } | null {
  try {
    const json = Buffer.from(id, "base64url").toString("utf-8");
    const o = JSON.parse(json) as { s?: string; u?: string; t?: string; st?: string; sts?: string };
    if (!o.u) return null;
    return {
      source: o.s ?? "",
      url: o.u,
      title: o.t ?? "",
      startTime: o.st ?? "",
      status: o.sts ?? "",
    };
  } catch {
    return null;
  }
}
