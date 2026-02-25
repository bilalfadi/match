/**
 * Base URL for the site – apne server par NEXT_PUBLIC_SITE_URL set karo.
 * Vercel use nahi ho raha, sirf apna server.
 */
export function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  return process.env.NODE_ENV === "production" ? "https://example.com" : "http://localhost:3000";
}
