import type { Metadata } from "next";
import StaticPageRenderer from "@/components/StaticPageRenderer";
import { getBaseUrl } from "@/lib/env";

const BASE_URL = getBaseUrl();

export const metadata: Metadata = {
  title: "Cookies Policy",
  description: "How we use cookies on Football Live.",
  alternates: { canonical: `${BASE_URL}/cookies` },
  openGraph: { url: `${BASE_URL}/cookies`, type: "website" },
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  return <StaticPageRenderer slug="cookies" fallbackTitle="Cookies Policy" />;
}
