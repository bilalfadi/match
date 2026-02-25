/**
 * Check if fetch-embeds-from-index API returns language in embeds.
 * Run: node scripts/check-api-language.mjs
 */
const API_BASE = "https://match-roan-ten.vercel.app";
const INDEX_URL = "https://totalsportek.army/game/juventus-vs-galatasaray/62639/";

async function main() {
  console.log("Calling API:", API_BASE + "/api/fetch-embeds-from-index");
  console.log("Index URL:", INDEX_URL);
  const res = await fetch(API_BASE + "/api/fetch-embeds-from-index", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ indexUrl: INDEX_URL }),
  });
  const data = await res.json();
  if (!data.ok) {
    console.log("API error:", data.error);
    return;
  }
  console.log("\nEmbeds count:", data.embeds?.length ?? 0);
  data.embeds?.forEach((e, i) => {
    console.log(
      `${i + 1}. language=${JSON.stringify(e.language)} label=${JSON.stringify(e.label?.slice(0, 40))} embedUrl=${e.embedUrl?.slice(0, 50)}...`
    );
  });
  const withLang = data.embeds?.filter((e) => e.language != null && e.language !== "") ?? [];
  console.log("\nEmbeds with language:", withLang.length, "of", data.embeds?.length ?? 0);
}

main().catch((e) => console.error(e));
