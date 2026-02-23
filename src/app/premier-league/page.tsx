import { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Premier League - Football Live",
  description: "Latest Premier League news and updates.",
};

export default async function PremierLeaguePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  return (
    <CategoryPage
      category="premier-league"
      initialPage={page ? parseInt(page, 10) : 1}
    />
  );
}
