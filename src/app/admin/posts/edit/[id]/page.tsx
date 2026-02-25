"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { authHeaders } from "@/lib/adminAuth";
import slugify from "slugify";
import AdminEditor from "@/components/AdminEditor";

const CATEGORIES = [
  { value: "news", label: "News" },
  { value: "football", label: "Football" },
  { value: "premier-league", label: "Premier League" },
];

export default function EditPostPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("news");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [author, setAuthor] = useState("Admin");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const slugPreview = useMemo(() => {
    const s = slugify(title || "post", { lower: true, strict: true });
    return s || "post";
  }, [title]);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin");
      return;
    }
    fetch(`/api/posts/${id}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) router.replace("/admin");
        else {
          setTitle(data.title || "");
          setCategory(data.category || "news");
          setContent(data.content || "");
          setImage(data.image || "");
          setExcerpt(data.excerpt || "");
          setAuthor(data.author || "Admin");
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
      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          title,
          category,
          content,
          image: image || "https://placehold.co/800x450/1a1a1a/666",
          excerpt: excerpt || content.slice(0, 160),
          author,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update");
        return;
      }
      router.push("/admin/posts");
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
      <Link href="/admin/posts" className="text-gray-400 hover:text-white mb-4 inline-block">
        ← Back to Posts
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">Edit Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            {error}
          </p>
        )}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main editor column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-4">
              <label className="block text-xs font-medium text-gray-400 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-dark-bg border border-dark-border text-white text-lg focus:border-primary focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Permalink: <span className="text-gray-300">/{slugPreview}</span>
              </p>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-medium text-gray-400">Content</label>
                <button
                  type="button"
                  onClick={() => {
                    if (!excerpt.trim() && content.trim()) setExcerpt(content.replace(/<[^>]*>/g, "").slice(0, 160));
                  }}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Auto excerpt
                </button>
              </div>
              <AdminEditor value={content} onChange={setContent} />
            </div>
          </div>

          {/* Sidebar column */}
          <aside className="space-y-4">
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Update</h3>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-red-600 disabled:opacity-50"
                >
                  {saving ? "Updating..." : "Update"}
                </button>
                <Link
                  href="/admin/posts"
                  className="px-4 py-2 rounded-lg border border-dark-border text-gray-400 hover:text-white"
                >
                  Cancel
                </Link>
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Category</h3>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-dark-bg border border-dark-border text-white focus:border-primary focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Featured Image</h3>
              <p className="text-xs text-gray-500 mb-2">PC se select karein ya link paste karein</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white file:font-medium file:cursor-pointer"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const form = new FormData();
                  form.append("file", f);
                  const token = localStorage.getItem("admin_token");
                  try {
                    const res = await fetch("/api/upload", {
                      method: "POST",
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                      body: form,
                    });
                    const data = await res.json();
                    if (data.url) setImage(data.url);
                    else if (data.error) setError(data.error);
                  } catch {
                    setError("Upload fail");
                  }
                }}
              />
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="Ya image URL paste karein (https://...)"
                className="w-full mt-2 px-4 py-2 rounded-lg bg-dark-bg border border-dark-border text-white focus:border-primary focus:outline-none text-sm"
              />
              {image?.trim() && (
                <div className="mt-3 rounded-lg overflow-hidden border border-dark-border bg-dark-bg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="Featured preview" className="w-full h-32 object-cover" />
                </div>
              )}
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Excerpt</h3>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-dark-bg border border-dark-border text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Author</h3>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-dark-bg border border-dark-border text-white focus:border-primary focus:outline-none"
              />
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
