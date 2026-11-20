export const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "PKR", "AED"] as const;

export function money(value: number, currency = "USD") {
  const code = currencies.includes(currency as (typeof currencies)[number]) ? currency : "USD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code
  }).format(Number.isFinite(value) ? value : 0);
}

export function when(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function day(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function num(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function titleCase(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
