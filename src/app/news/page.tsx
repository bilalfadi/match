import { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";
import PageHero from "@/components/PageHero";
import { getBaseUrl } from "@/lib/env";

export const revalidate = 60;

const BASE_URL = getBaseUrl();

export const metadata: Metadata = {
  title: "Football News",
  description:
    "Latest breaking football stories, transfer rumours, match reactions and expert analysis. Stay updated with Football Live.",
  alternates: { canonical: `${BASE_URL}/news` },
  openGraph: {
    url: `${BASE_URL}/news`,
    title: "Football News | Football Live",
    description:
      "Latest breaking football stories, transfer rumours, match reactions and expert analysis.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  return (
    <>
      <PageHero
        title="Football News"
        subtitle="Latest breaking football stories, transfer rumours, match reactions and expert analysis."
        badge="News"
        backgroundUrl="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1600&q=80"
      />
      <CategoryPage
        category="news"
        initialPage={page ? parseInt(page, 10) : 1}
        showTitle={false}
      />
    </>
  );
}
