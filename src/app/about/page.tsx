import type { Metadata } from "next";
import StaticPageRenderer from "@/components/StaticPageRenderer";
import { getBaseUrl } from "@/lib/env";

const BASE_URL = getBaseUrl();

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Football Live - your destination for live football and news.",
  alternates: { canonical: `${BASE_URL}/about` },
  openGraph: { url: `${BASE_URL}/about`, type: "website" },
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return <StaticPageRenderer slug="about" fallbackTitle="About Us" />;
}
