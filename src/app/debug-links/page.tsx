"use client";

import { useState } from "react";

type LinkResult = {
  label: string;
  detailUrl: string;
  embedUrl: string | null;
  matchTitle: string | null;
  leagueName: string | null;
};

type ApiResponse =
  | { ok: true; indexUrl: string; links: LinkResult[] }
  | { ok: false; error: string };

export default function DebugLinksPage() {
  const [indexUrl, setIndexUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LinkResult[]>([]);
  const [selectedEmbed, setSelectedEmbed] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedEmbed(null);

    try {
      const res = await fetch("/api/debug-index-to-embeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indexUrl }),
      });
      const data: ApiResponse = await res.json();
      if (!data.ok) {
        setError(data.error || "Failed to fetch");
        return;
      }
      setResults(data.links);
      const firstWithEmbed = data.links.find((l) => l.embedUrl);
      setSelectedEmbed(firstWithEmbed?.embedUrl ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const embedsOnly = results.filter((r) => r.embedUrl);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
        Index URL → Detail Links &amp; Embeds
      </h1>
      <p className="text-sm text-gray-400 mb-6 max-w-2xl">
        Paste a main/index URL (e.g. Totalsportek match page). We will try to
        extract all &quot;Watch/Stream&quot; links from that page, then for each
        detail page try to parse the actual iframe/embed URL.
      </p>

      <form onSubmit={handleSubmit} className="mb-8 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            required
            value={indexUrl}
            onChange={(e) => setIndexUrl(e.target.value)}
            placeholder="https://live.totalsportek777.com/Atalanta-vs-Borussia-Dortmund/62638"
            className="flex-1 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Fetching..." : "Fetch links"}
          </button>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>

      {results.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Detail pages ({results.length})
            </h2>
            <div className="max-h-[480px] overflow-y-auto rounded-lg border border-gray-800 bg-gray-950/60">
              <ul className="divide-y divide-gray-800 text-sm">
                {results.map((item, idx) => (
                  <li key={idx} className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-100 font-medium truncate">
                        {item.label || `Link ${idx + 1}`}
                      </span>
                      <span
                        className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          item.embedUrl
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-600/60"
                            : "bg-gray-700/30 text-gray-300 border border-gray-700"
                        }`}
                      >
                        {item.embedUrl ? "EMBED FOUND" : "NO EMBED"}
                      </span>
                    </div>
                    {item.matchTitle && (
                      <div className="mt-1 text-[11px] text-gray-300">
                        {item.matchTitle}
                      </div>
                    )}
                    {item.leagueName && (
                      <div className="mt-0.5 text-[11px] text-primary">
                        {item.leagueName}
                      </div>
                    )}
                    <div className="mt-1 text-[11px] text-gray-400 break-all">
                      {item.detailUrl}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Working embeds ({embedsOnly.length})
            </h2>
            <div className="max-h-[260px] overflow-y-auto rounded-lg border border-gray-800 bg-gray-950/60">
              <ul className="divide-y divide-gray-800 text-sm">
                {embedsOnly.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-3 hover:bg-gray-900/60 cursor-pointer"
                    onClick={() => {
                      if (item.embedUrl) setSelectedEmbed(item.embedUrl);
                    }}
                  >
                    <div className="text-gray-100 font-medium truncate">
                      {item.label || `Embed ${idx + 1}`}
                    </div>
                    {item.matchTitle && (
                      <div className="mt-1 text-[11px] text-gray-300">
                        {item.matchTitle}
                      </div>
                    )}
                    {item.leagueName && (
                      <div className="mt-0.5 text-[11px] text-primary">
                        {item.leagueName}
                      </div>
                    )}
                    <div className="mt-1 text-[11px] text-gray-400 break-all">
                      {item.embedUrl}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="iframe-wrap">
              <div className="ratio">
                {selectedEmbed ? (
                  <iframe
                    src={selectedEmbed}
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title="Embed preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-gray-500 bg-black">
                    No embed selected yet. Click an embed row on the right.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <p className="text-sm text-gray-500">
          Enter a main URL above and click &quot;Fetch links&quot; to see detail
          pages and their iframe/embed URLs.
        </p>
      )}
    </div>
  );
}

