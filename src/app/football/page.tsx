import { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Football - Football Live",
  description: "Latest Football articles and updates.",
};

export default async function FootballPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  return (
    <CategoryPage
      category="football"
      initialPage={page ? parseInt(page, 10) : 1}
    />
  );
}
