"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authHeaders } from "@/lib/adminAuth";
import TeamBadge from "@/components/TeamBadge";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  status: string;
  matchTime: string;
  streamUrl?: string;
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin");
      return;
    }
    fetch("/api/matches", { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMatches(data);
        else setMatches([]);
      })
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this match?")) return;
    const res = await fetch(`/api/matches/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) setMatches((m) => m.filter((x) => x.id !== id));
  };

  const setStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/matches/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setMatches((m) =>
        m.map((x) => (x.id === id ? { ...x, status } : x))
      );
    }
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Matches</h1>
        <Link
          href="/admin/matches/new"
          className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-red-600"
        >
          Add Match
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-dark-border text-gray-400 text-sm">
              <th className="pb-3 font-medium">Match</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Time</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id} className="border-b border-dark-border/50">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <TeamBadge name={m.homeTeam} logoUrl={m.homeLogo ?? ""} size="md" />
                    <span className="text-white">{m.homeTeam}</span>
                    <span className="text-gray-500">vs</span>
                    <TeamBadge name={m.awayTeam} logoUrl={m.awayLogo ?? ""} size="md" />
                    <span className="text-white">{m.awayTeam}</span>
                  </div>
                </td>
                <td className="py-3">
                  <select
                    value={m.status}
                    onChange={(e) => setStatus(m.id, e.target.value)}
                    className="bg-dark-card border border-dark-border rounded px-2 py-1 text-white text-sm"
                  >
                    <option value="LIVE">LIVE</option>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="FINISHED">FINISHED</option>
                  </select>
                </td>
                <td className="py-3 text-gray-400 text-sm">
                  {m.matchTime ? new Date(m.matchTime).toLocaleString() : ""}
                </td>
                <td className="py-3 flex gap-2">
                  <Link
                    href={`/admin/matches/edit/${m.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    className="text-sm text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {matches.length === 0 && (
        <p className="text-gray-400 py-8">No matches. Add a match to get started.</p>
      )}
    </div>
  );
}
