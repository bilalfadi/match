import type { Metadata } from "next";
import StaticPageRenderer from "@/components/StaticPageRenderer";
import { getBaseUrl } from "@/lib/env";

const BASE_URL = getBaseUrl();

export const metadata: Metadata = {
  title: "CCPA",
  description: "California Consumer Privacy Act disclosure for Football Live.",
  alternates: { canonical: `${BASE_URL}/ccpa` },
  openGraph: { url: `${BASE_URL}/ccpa`, type: "website" },
  robots: { index: true, follow: true },
};

export default function CCPAPage() {
  return <StaticPageRenderer slug="ccpa" fallbackTitle="CCPA" />;
}
