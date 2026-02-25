"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authHeaders } from "@/lib/adminAuth";

const STATUSES = ["LIVE", "UPCOMING", "FINISHED"];

export default function NewMatchPage() {
  const router = useRouter();
  const [detailUrl, setDetailUrl] = useState("");
  const [status, setStatus] = useState("LIVE");
  const [matchTime, setMatchTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddFromLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const url = detailUrl.trim();
    if (!url || !url.startsWith("http")) {
      setError("Enter a valid URL");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/matches/from-link", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          detailUrl: url,
          status,
          matchTime: matchTime ? new Date(matchTime).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add match");
        return;
      }
      router.push("/admin/matches");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link href="/admin/matches" className="text-gray-400 hover:text-white mb-4 inline-block">
        ← Back to Matches
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">Add Match</h1>
      <form onSubmit={handleAddFromLink} className="max-w-xl space-y-4">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            {error}
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Match page URL</label>
          <input
            type="url"
            value={detailUrl}
            onChange={(e) => setDetailUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-white"
            required
          />
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
          <label className="block text-sm font-medium text-gray-300 mb-1">Match date/time (optional)</label>
          <input
            type="datetime-local"
            value={matchTime}
            onChange={(e) => setMatchTime(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-white"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "Adding…" : "Add Match"}
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
