import { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";
import PageHero from "@/components/PageHero";
import { getBaseUrl } from "@/lib/env";

export const revalidate = 60;

const BASE_URL = getBaseUrl();

export const metadata: Metadata = {
  title: "World Football",
  description:
    "Top stories from leagues around the world – fixtures, results, talking points and more. Follow global football on Football Live.",
  alternates: { canonical: `${BASE_URL}/football` },
  openGraph: {
    url: `${BASE_URL}/football`,
    title: "World Football | Football Live",
    description: "Top stories from leagues around the world – fixtures, results and talking points.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default async function FootballPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  return (
    <>
      <PageHero
        title="World Football"
        subtitle="Top stories from leagues around the world – fixtures, results, talking points and more."
        badge="Football"
        backgroundUrl="https://images.unsplash.com/photo-1522778119026-d647f0596c4c?w=1600&q=80"
      />
      <CategoryPage
        category="football"
        initialPage={page ? parseInt(page, 10) : 1}
        showTitle={false}
      />
    </>
  );
}
