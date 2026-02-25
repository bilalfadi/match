import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import LiveMatchesSection from "@/components/LiveMatchesSection";
import PostCard from "@/components/PostCard";
import { getLatestPostsByCategory } from "@/lib/posts";
import { getBaseUrl } from "@/lib/env";

export const revalidate = 60;

const BASE_URL = getBaseUrl();

export const metadata: Metadata = {
  title: "Watch Live Football Matches & Latest News",
  description:
    "Stream live football matches and stay updated with the latest football news, Premier League updates, and match schedules.",
  alternates: { canonical: BASE_URL },
  openGraph: {
    url: BASE_URL,
    title: "Watch Live Football Matches & Latest News | Football Live",
    description: "Stream live football matches and stay updated with the latest football news.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default async function HomePage() {
  const [news, football, premierLeague] = await Promise.all([
    getLatestPostsByCategory("news", 6),
    getLatestPostsByCategory("football", 6),
    getLatestPostsByCategory("premier-league", 6),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-stadium-gradient" />
        <div className="relative z-10 container mx-auto max-w-4xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Watch Live Football Matches & Latest News
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Stream the biggest games live and stay updated with breaking news, scores, and analysis from the world of football.
          </p>
          <div className="mt-10 max-w-3xl mx-auto">
            <AdSlot position="hero" className="min-h-[120px]" />
          </div>
        </div>
      </section>

      <LiveMatchesSection />

      {/* News */}
      <section className="container mx-auto px-4 py-12">
        <AdSlot position="home-between-sections" className="mb-8" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-6 rounded bg-primary" />
            Latest News
          </h2>
          <Link href="/news" className="text-primary hover:underline font-medium">
            View all
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((post) => (
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
        {news.length === 0 && (
          <p className="text-gray-400 text-center py-8">No news yet. Check back later.</p>
        )}
      </section>

      {/* Football */}
      <section className="container mx-auto px-4 py-12">
        <AdSlot position="home-between-sections" className="mb-8" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-6 rounded bg-primary" />
            Football
          </h2>
          <Link href="/football" className="text-primary hover:underline font-medium">
            View all
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {football.map((post) => (
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
        {football.length === 0 && (
          <p className="text-gray-400 text-center py-8">No posts yet.</p>
        )}
      </section>

      {/* Premier League */}
      <section className="container mx-auto px-4 py-12">
        <AdSlot position="home-between-sections" className="mb-8" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-6 rounded bg-primary" />
            Premier League
          </h2>
          <Link href="/premier-league" className="text-primary hover:underline font-medium">
            View all
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {premierLeague.map((post) => (
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
        {premierLeague.length === 0 && (
          <p className="text-gray-400 text-center py-8">No posts yet.</p>
        )}
      </section>
    </div>
  );
}
