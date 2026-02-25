"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export default function AdminDashboardPage() {
  const [auth, setAuth] = useState(false);
  const [stats, setStats] = useState<{ posts: number; matches: number; live: number } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/admin");
      return;
    }
    setAuth(true);
    Promise.all([
      fetch("/api/posts?limit=1").then((r) => r.json()).then((d) => d.total ?? 0),
      fetch("/api/matches").then((r) => r.json()).then((arr) => (Array.isArray(arr) ? arr.length : 0)),
      fetch("/api/matches?status=LIVE").then((r) => r.json()).then((arr) => (Array.isArray(arr) ? arr.length : 0)),
    ])
      .then(([posts, matches, live]) => setStats({ posts, matches, live }))
      .catch(() => setStats({ posts: 0, matches: 0, live: 0 }));
  }, [router]);

  if (!auth) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="glass-card p-6">
          <h3 className="text-gray-400 text-sm font-medium">Total Posts</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats?.posts ?? "—"}</p>
          <Link href="/admin/posts" className="text-primary text-sm mt-2 inline-block hover:underline">
            Manage →
          </Link>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-gray-400 text-sm font-medium">Matches</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats?.matches ?? "—"}</p>
          <Link href="/admin/matches" className="text-primary text-sm mt-2 inline-block hover:underline">
            Manage →
          </Link>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-gray-400 text-sm font-medium">Live Now</h3>
          <p className="text-3xl font-bold text-primary mt-1">{stats?.live ?? "—"}</p>
          <Link href="/" className="text-primary text-sm mt-2 inline-block hover:underline">
            View Matches →
          </Link>
        </div>
      </div>
    </div>
  );
}
