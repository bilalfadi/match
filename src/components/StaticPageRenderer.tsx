import { getPage } from "@/lib/data/pages";
import type { PageSlug } from "@/lib/data/pages";

export default async function StaticPageRenderer({
  slug,
  fallbackTitle,
}: {
  slug: PageSlug;
  fallbackTitle: string;
}) {
  const page = await getPage(slug);
  const title = page?.title || fallbackTitle;
  const content = page?.content || "";

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-white mb-6">{title}</h1>
      <div
        className="prose prose-invert max-w-none text-gray-300 space-y-4"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}

