export function getCategoryTitle(category: string): string {
  const map: Record<string, string> = {
    news: "News",
    football: "Football",
    "premier-league": "Premier League",
  };
  return map[category] || category;
}

export function getCategorySlug(category: string): string {
  return category;
}
