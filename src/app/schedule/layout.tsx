import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/env";

const BASE_URL = getBaseUrl();

export const metadata: Metadata = {
  title: "Match Schedule",
  description:
    "Live football match schedule, upcoming fixtures and results. Watch live matches and stay updated with Football Live.",
  alternates: { canonical: `${BASE_URL}/schedule` },
  openGraph: {
    url: `${BASE_URL}/schedule`,
    title: "Match Schedule | Football Live",
    description: "Live football match schedule, upcoming fixtures and results.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
