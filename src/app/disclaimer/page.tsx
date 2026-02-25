import type { Metadata } from "next";
import StaticPageRenderer from "@/components/StaticPageRenderer";
import { getBaseUrl } from "@/lib/env";

const BASE_URL = getBaseUrl();

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Disclaimer and legal information for Football Live.",
  alternates: { canonical: `${BASE_URL}/disclaimer` },
  openGraph: { url: `${BASE_URL}/disclaimer`, type: "website" },
  robots: { index: true, follow: true },
};

export default function DisclaimerPage() {
  return <StaticPageRenderer slug="disclaimer" fallbackTitle="Disclaimer" />;
}
