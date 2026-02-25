"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authHeaders } from "@/lib/adminAuth";

interface Post {
  id: string;
  slug: string;
  title: string;
  category: string;
  createdAt: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin");
      return;
    }
    fetch("/api/posts?limit=50", { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) router.replace("/admin");
        else setPosts(d.posts || []);
      })
      .catch(() => router.replace("/admin"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/posts/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) setPosts((p) => p.filter((x) => x.id !== id));
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-red-600"
        >
          Add Post
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-dark-border text-gray-400 text-sm">
              <th className="pb-3 font-medium">Title</th>
              <th className="pb-3 font-medium">Category</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-dark-border/50">
                <td className="py-3 text-white">{p.title}</td>
                <td className="py-3 text-gray-400 capitalize">{p.category?.replace("-", " ")}</td>
                <td className="py-3 text-gray-400 text-sm">
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}
                </td>
                <td className="py-3 flex gap-2">
                  <Link
                    href={`/admin/posts/edit/${p.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="text-sm text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {posts.length === 0 && (
        <p className="text-gray-400 py-8">No posts yet. Add your first post.</p>
      )}
    </div>
  );
}
