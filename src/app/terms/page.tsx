import type { Metadata } from "next";
import StaticPageRenderer from "@/components/StaticPageRenderer";
import { getBaseUrl } from "@/lib/env";

const BASE_URL = getBaseUrl();

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions of use for Football Live.",
  alternates: { canonical: `${BASE_URL}/terms` },
  openGraph: { url: `${BASE_URL}/terms`, type: "website" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return <StaticPageRenderer slug="terms" fallbackTitle="Terms & Conditions" />;
}
