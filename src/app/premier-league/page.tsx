import { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";
import PageHero from "@/components/PageHero";
import { getBaseUrl } from "@/lib/env";

export const revalidate = 60;

const BASE_URL = getBaseUrl();

export const metadata: Metadata = {
  title: "Premier League Hub",
  description:
    "Live updates, results, table talk and transfer news from the English Premier League. Your Premier League source on Football Live.",
  alternates: { canonical: `${BASE_URL}/premier-league` },
  openGraph: {
    url: `${BASE_URL}/premier-league`,
    title: "Premier League Hub | Football Live",
    description: "Live updates, results, table talk and transfer news from the English Premier League.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default async function PremierLeaguePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  return (
    <>
      <PageHero
        title="Premier League Hub"
        subtitle="Live updates, results, table talk and transfer news from the English Premier League."
        badge="Premier League"
        backgroundUrl="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80"
      />
      <CategoryPage
        category="premier-league"
        initialPage={page ? parseInt(page, 10) : 1}
        showTitle={false}
      />
    </>
  );
}
