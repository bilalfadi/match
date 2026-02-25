"use client";

import { useEffect, useState } from "react";
import PostCard from "@/components/PostCard";
import AdSlot from "@/components/AdSlot";
import { getCategoryTitle } from "@/lib/categories";

type Category = "news" | "football" | "premier-league";

interface Post {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string;
  image: string;
  createdAt?: string;
  category?: string;
}

interface ApiResponse {
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
}

export default function CategoryPage({
  category,
  initialPage = 1,
  showTitle = true,
}: {
  category: Category;
  initialPage?: number;
  showTitle?: boolean;
}) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/posts?category=${category}&page=${page}&limit=12`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category, page]);

  const title = getCategoryTitle(category);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          {showTitle && (
            <h1 className="text-3xl font-bold text-white mb-6">{title}</h1>
          )}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 rounded-xl bg-dark-card animate-pulse" />
              ))}
            </div>
          ) : data?.posts?.length ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.posts.map((post) => (
                  <PostCard
                    key={post.slug}
                    slug={post.slug}
                    title={post.title}
                    excerpt={post.excerpt}
                    image={post.image}
                    createdAt={post.createdAt}
                    category={post.category}
                  />
                ))}
              </div>
              {data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-lg bg-dark-card border border-dark-border disabled:opacity-50 hover:border-primary transition"
                  >
                    Previous
                  </button>
                  <span className="px-4 text-gray-400">
                    Page {page} of {data.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page >= data.totalPages}
                    className="px-4 py-2 rounded-lg bg-dark-card border border-dark-border disabled:opacity-50 hover:border-primary transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400 py-12 text-center">No posts in this category yet.</p>
          )}
        </div>
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="lg:sticky lg:top-24">
            <AdSlot position="sidebar" className="min-h-[250px]" />
          </div>
        </aside>
      </div>
    </div>
  );
}
