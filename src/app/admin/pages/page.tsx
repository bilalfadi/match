"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authHeaders } from "@/lib/adminAuth";

interface PageItem {
  slug: string;
  title: string;
  updatedAt: string;
}

export default function AdminPagesList() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin");
      return;
    }
    fetch("/api/pages", { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) {
          router.replace("/admin");
          return;
        }
        setPages(d.pages || []);
      })
      .catch(() => setPages([]))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Pages</h1>
        <p className="text-sm text-gray-400">Edit footer/legal pages content.</p>
      </div>

      <div className="glass-card p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-dark-border text-gray-400 text-sm">
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">Slug</th>
                <th className="pb-3 font-medium">Updated</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.slug} className="border-b border-dark-border/50">
                  <td className="py-3 text-white">{p.title}</td>
                  <td className="py-3 text-gray-400 text-sm">/{p.slug}</td>
                  <td className="py-3 text-gray-400 text-sm">
                    {p.updatedAt ? new Date(p.updatedAt).toLocaleString() : ""}
                  </td>
                  <td className="py-3 flex gap-3">
                    <Link
                      href={`/admin/pages/edit/${p.slug}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/${p.slug}`}
                      target="_blank"
                      className="text-sm text-gray-400 hover:text-white"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages.length === 0 && (
          <p className="text-gray-400 py-6">No pages found.</p>
        )}
      </div>
    </div>
  );
}

