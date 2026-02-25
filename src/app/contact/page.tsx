import type { Metadata } from "next";
import StaticPageRenderer from "@/components/StaticPageRenderer";
import { getBaseUrl } from "@/lib/env";

const BASE_URL = getBaseUrl();

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact Football Live. DMCA and general inquiries.",
  alternates: { canonical: `${BASE_URL}/contact` },
  openGraph: { url: `${BASE_URL}/contact`, type: "website" },
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return <StaticPageRenderer slug="contact" fallbackTitle="Contact Us" />;
}
