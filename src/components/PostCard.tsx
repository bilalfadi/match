import Link from "next/link";
import Image from "next/image";

interface PostCardProps {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string;
  image: string;
  createdAt?: string;
  category?: string;
}

export default function PostCard({
  slug,
  title,
  excerpt,
  image,
  createdAt,
  category,
}: PostCardProps) {
  const date = createdAt
    ? new Date(createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <article className="glass-card group">
      <Link href={`/post/${slug}`} className="block">
        <div className="relative aspect-video overflow-hidden rounded-lg mb-4 bg-dark-card">
          <Image
            src={image || "/placeholder-post.jpg"}
            alt={title}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/600x340/1a1a1a/666?text=No+Image";
            }}
          />
          {category && (
            <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium rounded bg-primary/90 text-white capitalize">
              {category.replace("-", " ")}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-white group-hover:text-primary transition line-clamp-2 mb-2">
          {title}
        </h3>
        {excerpt && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-2">{excerpt}</p>
        )}
        {date && <p className="text-xs text-gray-500">{date}</p>}
        <span className="inline-block mt-2 text-sm font-medium text-primary group-hover:underline">
          Read More →
        </span>
      </Link>
    </article>
  );
}
