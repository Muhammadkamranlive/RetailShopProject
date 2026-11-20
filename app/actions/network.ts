"use server";

import { redirect } from "next/navigation";
import { done, fail, text } from "@/lib/form";
import { refreshOps } from "@/lib/refresh";
import { getSession, requireOrg } from "@/lib/session";

export type OrgState = { error?: string } | null;

export async function createOrganization(_prev: OrgState, formData: FormData): Promise<OrgState> {
  const session = await getSession();
  if (!session.configured || !session.user || !session.supabase) redirect("/login");
  if (session.org) redirect("/home");
  const name = text(formData, "name");
  const currency = text(formData, "currency").toUpperCase() || "USD";
  const country = text(formData, "country");
  const { error } = await session.supabase.rpc("create_organization", {
    p_name: name,
    p_currency: currency,
    p_country: country
  });
  if (error) return { error: error.message };
  redirect("/home");
}

export async function updateCompany(formData: FormData) {
  const { supabase, org } = await requireOrg();
  const name = text(formData, "name");
  const currency = text(formData, "currency").toUpperCase() || org.currency;
  const country = text(formData, "country");
  const { error } = await supabase.rpc("update_organization", {
    p_org_id: org.id,
    p_name: name,
    p_currency: currency,
    p_country: country
  });
  if (error) fail("/company", error.message);
  refreshOps();
  done("/company", "Company profile saved.");
}

export async function loadDemo() {
  const { supabase, org } = await requireOrg();
  const { error } = await supabase.rpc("seed_harbor_and_rye", { p_org_id: org.id });
  if (error) fail("/home", error.message);
  refreshOps();
  done("/home", "Harbor & Rye is loaded. Four stores, a grocery catalog, open purchase orders, and a month of sales.");
}

export async function createStore(formData: FormData) {
  const { supabase, org } = await requireOrg();
  const payload = {
    org_id: org.id,
    code: text(formData, "code").toUpperCase(),
    name: text(formData, "name"),
    city: text(formData, "city"),
    region: text(formData, "region"),
    format: text(formData, "format")
  };
  if (!payload.code || !payload.name || !payload.city || !payload.region) fail("/stores", "Code, name, city, and region are required.");
  const { error } = await supabase.from("stores").insert(payload);
  if (error) fail("/stores", error.message);
  refreshOps();
  done("/stores", `${payload.name} added to the network.`);
}

export async function openShift(formData: FormData) {
  const { supabase, org } = await requireOrg();
  const storeId = text(formData, "store_id");
  const opening = Number(text(formData, "opening_float") || "0");
  const { data: existing } = await supabase
    .from("shifts")
    .select("id")
    .eq("store_id", storeId)
    .eq("status", "open")
    .maybeSingle();
  if (existing) fail("/stores", "That store already has an open shift.");
  const { error } = await supabase.from("shifts").insert({
    org_id: org.id,
    store_id: storeId,
    status: "open",
    opening_float: Number.isFinite(opening) ? opening : 0
  });
  if (error) fail("/stores", error.message);
  refreshOps();
  done("/stores", "Shift opened.");
}

export async function closeShift(formData: FormData) {
  const { supabase } = await requireOrg();
  const shiftId = text(formData, "shift_id");
  const closing = Number(text(formData, "closing_cash") || "0");
  const { error } = await supabase
    .from("shifts")
    .update({
      status: "closed",
      closing_cash: Number.isFinite(closing) ? closing : 0,
      closed_at: new Date().toISOString()
    })
    .eq("id", shiftId)
    .eq("status", "open");
  if (error) fail("/stores", error.message);
  refreshOps();
  done("/stores", "Shift closed.");
}
