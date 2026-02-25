import type { Metadata } from "next";
import { findMatchById } from "@/lib/data/matches";
import { getBaseUrl } from "@/lib/env";

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const base = getBaseUrl();
  const canonical = `${base}/match/${id}`;
  const match = await findMatchById(id);
  if (!match) {
    return { title: "Match not found", alternates: { canonical }, robots: { index: false } };
  }
  const title = `${match.homeTeam} vs ${match.awayTeam}`;
  const description = `Watch ${match.homeTeam} vs ${match.awayTeam} live stream.`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      url: canonical,
      title: `${title} | Football Live`,
      description,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: `${title} | Football Live` },
    robots: { index: true, follow: true },
  };
}

export default function MatchDetailLayout({ children }: Props) {
  return children;
}
