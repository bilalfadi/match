import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { findPostBySlug, findRelatedPosts } from "@/lib/data/posts";
import AdSlot from "@/components/AdSlot";
import { getBaseUrl } from "@/lib/env";

export const revalidate = 60;

const RESERVED = new Set(["admin", "api", "post"]);
const BASE_URL = getBaseUrl();

type Props = { params: Promise<{ slug: string }> };

function truncateDesc(s: string, max = 160): string {
  const t = (s || "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 3).trim() + "...";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED.has(slug)) return { title: "Not found" };
  const post = await findPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  const title = post.title.length > 55 ? post.title.slice(0, 52) + "..." : post.title;
  const description = truncateDesc(post.excerpt || post.title, 160);
  const canonical = `${BASE_URL}/${slug}`;
  const image = post.image || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&h=630&fit=crop";
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: post.title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      authors: post.author ? [post.author] : undefined,
      section: post.category?.replace("-", " ") || undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params;
  if (RESERVED.has(slug)) notFound();
  const post = await findPostBySlug(slug);
  if (!post) notFound();

  const date = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const related = await findRelatedPosts(post.category, post._id, 3);
  const articleImage = post.image || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&h=630&fit=crop";
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: truncateDesc(post.excerpt || post.title, 160),
    image: articleImage,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.author || "Admin" },
    publisher: { "@type": "Organization", name: "Football Live", logo: { "@type": "ImageObject", url: `${BASE_URL}/logo.png` } },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/${slug}` },
    articleSection: post.category?.replace("-", " ") || "News",
  };

  return (
    <article className="container mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="max-w-4xl mx-auto">
        <div className="relative h-56 sm:h-64 md:h-72 max-w-4xl rounded-xl overflow-hidden mb-6 bg-dark-card">
          <Image
            src={post.image || "https://placehold.co/800x450/1a1a1a/666?text=No+Image"}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 896px) 100vw, 896px"
          />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
          <span>By {post.author || "Admin"}</span>
          <span>{date}</span>
          <span className="px-2 py-0.5 rounded bg-primary/20 text-primary capitalize">
            {post.category?.replace("-", " ")}
          </span>
        </div>

        <AdSlot position="post-content" className="my-6" />

        <div
          className="prose prose-invert prose-lg max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {related.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Related Posts</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r._id}
                  href={`/${r.slug}`}
                  className="block p-4 rounded-xl bg-dark-card border border-dark-border hover:border-primary/50 transition"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-dark-bg">
                    <Image
                      src={r.image || "https://placehold.co/400x225/1a1a1a/666"}
                      alt={r.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="font-medium text-white line-clamp-2">{r.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
