export type Segment = "New" | "Active" | "Loyal" | "Lapsed";

export function segment(orderCount: number, lastPlacedAt: string | null, now = Date.now()): Segment {
  if (!orderCount || !lastPlacedAt) return "New";
  const days = (now - new Date(lastPlacedAt).getTime()) / 86_400_000;
  if (days > 45) return "Lapsed";
  if (orderCount >= 3 && days <= 30) return "Loyal";
  return "Active";
}

export function journey(channels: string[]) {
  const labels = [...new Set(channels)].map((channel) => {
    if (channel === "store") return "in store";
    if (channel === "web") return "on the web shop";
    return "on the marketplace";
  });
  if (labels.length === 0) return "No purchases yet";
  if (labels.length === 1) return `Shops ${labels[0]}`;
  return `Shops ${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
}
