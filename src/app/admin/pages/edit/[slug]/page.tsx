"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authHeaders } from "@/lib/adminAuth";
import AdminEditor from "@/components/AdminEditor";

export default function AdminEditPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin");
      return;
    }
    if (!slug) return;
    fetch(`/api/pages/${slug}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) {
          router.replace("/admin/pages");
          return;
        }
        setTitle(d.page?.title || "");
        setContent(d.page?.content || "");
      })
      .catch(() => router.replace("/admin/pages"))
      .finally(() => setLoading(false));
  }, [router, slug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/pages/${slug}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ title, content }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Failed to save");
        return;
      }
      router.push("/admin/pages");
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
      <Link href="/admin/pages" className="text-gray-400 hover:text-white mb-4 inline-block">
        ← Back to Pages
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">Edit Page</h1>

      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            {error}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-4">
              <label className="block text-xs font-medium text-gray-400 mb-2">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-dark-bg border border-dark-border text-white text-lg focus:border-primary focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                URL: <span className="text-gray-300">/{slug}</span>
              </p>
            </div>

            <div className="glass-card p-4">
              <label className="block text-xs font-medium text-gray-400 mb-3">Content</label>
              <AdminEditor value={content} onChange={setContent} />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Update</h3>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-red-600 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <Link
                  href={`/${slug}`}
                  target="_blank"
                  className="px-4 py-2 rounded-lg border border-dark-border text-gray-400 hover:text-white"
                >
                  View
                </Link>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Content is saved as <span className="text-gray-300">HTML</span>.
              </p>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}

