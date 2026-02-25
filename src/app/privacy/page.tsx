import type { Metadata } from "next";
import StaticPageRenderer from "@/components/StaticPageRenderer";
import { getBaseUrl } from "@/lib/env";

const BASE_URL = getBaseUrl();

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Football Live.",
  alternates: { canonical: `${BASE_URL}/privacy` },
  openGraph: { url: `${BASE_URL}/privacy`, type: "website" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return <StaticPageRenderer slug="privacy" fallbackTitle="Privacy Policy" />;
}
