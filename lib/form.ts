import { redirect } from "next/navigation";

export function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export function done(path: string, message: string): never {
  redirect(`${path}?notice=${encodeURIComponent(message)}`);
}

export function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function linesFromForm(formData: FormData) {
  const ids = formData.getAll("sku_id").map(String);
  const qtys = formData.getAll("qty").map(String);
  const merged = new Map<string, number>();
  ids.forEach((id, index) => {
    const qty = Number(qtys[index]);
    if (!id || !Number.isFinite(qty) || qty <= 0 || qty > 10000) return;
    merged.set(id, (merged.get(id) ?? 0) + Math.round(qty));
  });
  return [...merged.entries()].map(([sku_id, qty]) => ({ sku_id, qty }));
}
