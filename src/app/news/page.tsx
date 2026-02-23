import { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "News - Football Live",
  description: "Latest football news and updates.",
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  return (
    <CategoryPage
      category="news"
      initialPage={page ? parseInt(page, 10) : 1}
    />
  );
}
