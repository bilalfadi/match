"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { authHeaders } from "@/lib/adminAuth";
import TeamBadge from "@/components/TeamBadge";

const STATUSES = ["LIVE", "UPCOMING", "FINISHED"];

export default function EditMatchPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeLogo, setHomeLogo] = useState("");
  const [awayLogo, setAwayLogo] = useState("");
  const [status, setStatus] = useState("UPCOMING");
  const [streamUrl, setStreamUrl] = useState("");
  const [sourceDetailUrl, setSourceDetailUrl] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin");
      return;
    }
    fetch(`/api/matches/${id}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) router.replace("/admin");
        else {
          setHomeTeam(data.homeTeam || "");
          setAwayTeam(data.awayTeam || "");
          setHomeLogo(data.homeLogo || "");
          setAwayLogo(data.awayLogo || "");
          setStatus(data.status || "UPCOMING");
          setStreamUrl(data.streamUrl || "");
          setSourceDetailUrl(data.sourceDetailUrl || "");
          setMatchTime(
            data.matchTime
              ? new Date(data.matchTime).toISOString().slice(0, 16)
              : ""
          );
          setHomeScore(data.homeScore ?? 0);
          setAwayScore(data.awayScore ?? 0);
        }
      })
      .catch(() => router.replace("/admin"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          homeTeam,
          awayTeam,
          homeLogo: homeLogo?.trim() || "",
          awayLogo: awayLogo?.trim() || "",
          status,
          streamUrl: streamUrl || "",
          sourceDetailUrl: sourceDetailUrl || "",
          matchTime: new Date(matchTime).toISOString(),
          homeScore,
          awayScore,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update");
        return;
      }
      router.push("/admin/matches");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div>
      <Link href="/admin/matches" className="text-gray-400 hover:text-white mb-4 inline-block">
        ← Back to Matches
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">Edit Match</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Home Team</label>
            <input
              type="text"
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Away Team</label>
            <input
              type="text"
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Home Logo URL</label>
            <div className="flex items-center gap-2 mb-1">
              <TeamBadge name={homeTeam || "Home"} logoUrl={homeLogo} size="md" />
              <span className="text-gray-500 text-xs">Preview (same as site)</span>
            </div>
            <input
              type="url"
              value={homeLogo}
              onChange={(e) => setHomeLogo(e.target.value)}
              placeholder="Leave empty to use default image"
              className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Away Logo URL</label>
            <div className="flex items-center gap-2 mb-1">
              <TeamBadge name={awayTeam || "Away"} logoUrl={awayLogo} size="md" />
              <span className="text-gray-500 text-xs">Preview (same as site)</span>
            </div>
            <input
              type="url"
              value={awayLogo}
              onChange={(e) => setAwayLogo(e.target.value)}
              placeholder="Leave empty to use default image"
              className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-white"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Match Date & Time</label>
          <input
            type="datetime-local"
            value={matchTime}
            onChange={(e) => setMatchTime(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Home Score</label>
            <input
              type="number"
              min={0}
              value={homeScore}
              onChange={(e) => setHomeScore(parseInt(e.target.value, 10) || 0)}
              className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Away Score</label>
            <input
              type="number"
              min={0}
              value={awayScore}
              onChange={(e) => setAwayScore(parseInt(e.target.value, 10) || 0)}
              className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Detail page link</label>
          <input
            type="url"
            value={sourceDetailUrl}
            onChange={(e) => setSourceDetailUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Stream URL (optional)</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-white"
            />
            <button
              type="button"
              disabled={!sourceDetailUrl.trim() || extracting}
              onClick={async () => {
                if (!sourceDetailUrl.trim()) return;
                setExtracting(true);
                setError("");
                try {
                  const res = await fetch(`/api/extract-embed?url=${encodeURIComponent(sourceDetailUrl.trim())}`);
                  const data = await res.json();
                  if (data.ok && data.embedUrl) setStreamUrl(data.embedUrl);
                  else setError(data.message || data.error || "Stream link not found");
                } catch {
                  setError("Extract fail");
                } finally {
                  setExtracting(false);
                }
              }}
              className="px-4 py-2 rounded-lg bg-dark-border text-white text-sm hover:bg-dark-card disabled:opacity-50 whitespace-nowrap"
            >
              {extracting ? "..." : "Extract embed"}
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-red-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <Link
            href="/admin/matches"
            className="px-6 py-2 rounded-lg border border-dark-border text-gray-400 hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
