"use server";

import { done, fail, text } from "@/lib/form";
import { refreshOps } from "@/lib/refresh";
import { requireOrg } from "@/lib/session";

export type FormState = { error?: string } | null;

export async function createCategory(formData: FormData) {
  const { supabase, org } = await requireOrg();
  const name = text(formData, "name");
  if (!name) fail("/catalog", "Name the category.");
  const { error } = await supabase.from("categories").insert({ org_id: org.id, name });
  if (error) fail("/catalog", error.message);
  refreshOps();
  done("/catalog", `${name} added.`);
}

export async function createSupplier(formData: FormData) {
  const { supabase, org } = await requireOrg();
  const name = text(formData, "name");
  const email = text(formData, "email");
  const lead = Number(text(formData, "lead_time_days") || "5");
  if (!name) fail("/purchasing", "Name the supplier.");
  const { error } = await supabase.from("suppliers").insert({
    org_id: org.id,
    name,
    email: email || null,
    lead_time_days: Number.isFinite(lead) ? lead : 5
  });
  if (error) fail("/purchasing", error.message);
  refreshOps();
  done("/purchasing", `${name} added.`);
}

export async function createSku(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, org } = await requireOrg();
  const name = text(formData, "name");
  const brand = text(formData, "brand");
  const categoryId = text(formData, "category_id");
  const sku = text(formData, "sku").toUpperCase();
  const barcode = text(formData, "barcode");
  const cost = Number(text(formData, "cost"));
  const price = Number(text(formData, "price"));
  const reorderPoint = Number(text(formData, "reorder_point") || "12");
  const reorderQty = Number(text(formData, "reorder_qty") || "24");
  const supplierId = text(formData, "supplier_id");
  if (!name || !sku || !categoryId) return { error: "Name, SKU, and category are required." };
  if (!Number.isFinite(cost) || !Number.isFinite(price) || cost < 0 || price < 0) {
    return { error: "Cost and price need to be zero or more." };
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({ org_id: org.id, category_id: categoryId, name, brand: brand || null })
    .select("id")
    .single();
  if (productError || !product) return { error: productError?.message ?? "Could not save the product." };

  const { error } = await supabase.from("skus").insert({
    org_id: org.id,
    product_id: product.id,
    supplier_id: supplierId || null,
    sku,
    barcode: barcode || null,
    name,
    cost,
    price,
    reorder_point: Math.max(0, Math.round(reorderPoint)),
    reorder_qty: Math.max(0, Math.round(reorderQty))
  });
  if (error) {
    await supabase.from("products").delete().eq("id", product.id);
    return { error: error.message };
  }
  refreshOps();
  done("/catalog", `${name} added. Stock appears here after a purchase order is received.`);
}

export async function createCustomer(formData: FormData) {
  const { supabase, org } = await requireOrg();
  const name = text(formData, "name");
  if (!name) fail("/customers", "Name the customer.");
  const { error } = await supabase.from("customers").insert({
    org_id: org.id,
    name,
    email: text(formData, "email") || null,
    phone: text(formData, "phone") || null
  });
  if (error) fail("/customers", error.message);
  refreshOps();
  done("/customers", `${name} added.`);
}

export async function createIntegration(formData: FormData) {
  const { supabase, org } = await requireOrg();
  const system = text(formData, "system");
  const name = text(formData, "name");
  if (!system || !name) fail("/integrations", "System and name are required.");
  const { error } = await supabase.from("integrations").insert({
    org_id: org.id,
    system,
    name,
    status: text(formData, "status") === "connected" ? "connected" : "disconnected",
    endpoint: text(formData, "endpoint") || null
  });
  if (error) fail("/integrations", error.message);
  refreshOps();
  done("/integrations", `${name} saved.`);
}

export async function updateIntegration(formData: FormData) {
  const { supabase, org } = await requireOrg();
  const id = text(formData, "id");
  const { error } = await supabase
    .from("integrations")
    .update({
      status: text(formData, "status") === "connected" ? "connected" : "disconnected",
      endpoint: text(formData, "endpoint") || null
    })
    .eq("id", id)
    .eq("org_id", org.id);
  if (error) fail("/integrations", error.message);
  refreshOps();
  done("/integrations", "Connection updated.");
}
