import { revalidatePath } from "next/cache";

const paths = [
  "/home",
  "/stores",
  "/catalog",
  "/inventory",
  "/purchasing",
  "/orders",
  "/customers",
  "/forecast",
  "/reorder",
  "/integrations",
  "/company"
];

export function refreshOps() {
  for (const path of paths) revalidatePath(path);
}
