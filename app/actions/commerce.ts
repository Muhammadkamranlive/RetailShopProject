"use server";

import { buildForecast } from "@/lib/forecast";
import { done, fail, linesFromForm, text } from "@/lib/form";
import { planningInput } from "@/lib/queries";
import { refreshOps } from "@/lib/refresh";
import { requireOrg } from "@/lib/session";
import type { FormState } from "@/app/actions/catalog";

export async function createPurchaseOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, org } = await requireOrg();
  const supplierId = text(formData, "supplier_id");
  const storeId = text(formData, "store_id");
  const expectedAt = text(formData, "expected_at");
  const status = text(formData, "status") === "draft" ? "draft" : "sent";
  const lines = linesFromForm(formData);
  if (!supplierId || !storeId) return { error: "Choose a supplier and a receiving store." };
  if (lines.length === 0) return { error: "Add at least one line." };

  const { data: skus, error: skuError } = await supabase
    .from("skus")
    .select("id, cost")
    .eq("org_id", org.id)
    .in("id", lines.map((line) => line.sku_id));
  if (skuError) return { error: skuError.message };
  const costs = new Map((skus ?? []).map((sku) => [sku.id as string, Number(sku.cost)]));

  const { count } = await supabase
    .from("purchase_orders")
    .select("id", { count: "exact", head: true })
    .eq("org_id", org.id);
  const number = `PO-${1001 + (count ?? 0)}`;

  const { data: order, error } = await supabase
    .from("purchase_orders")
    .insert({
      org_id: org.id,
      supplier_id: supplierId,
      store_id: storeId,
      number,
      status,
      expected_at: expectedAt || null
    })
    .select("id")
    .single();
  if (error || !order) return { error: error?.message ?? "Could not save the purchase order." };

  const { error: lineError } = await supabase.from("purchase_order_lines").insert(
    lines.map((line) => ({
      org_id: org.id,
      purchase_order_id: order.id,
      sku_id: line.sku_id,
      qty: line.qty,
      unit_cost: costs.get(line.sku_id) ?? 0
    }))
  );
  if (lineError) {
    await supabase.from("purchase_orders").delete().eq("id", order.id);
    return { error: lineError.message };
  }
  refreshOps();
  done("/purchasing", `${number} saved as ${status}.`);
}

export async function sendPurchaseOrder(formData: FormData) {
  const { supabase, org } = await requireOrg();
  const id = text(formData, "id");
  const { error } = await supabase
    .from("purchase_orders")
    .update({ status: "sent" })
    .eq("id", id)
    .eq("org_id", org.id)
    .eq("status", "draft");
  if (error) fail("/purchasing", error.message);
  refreshOps();
  done("/purchasing", "Purchase order sent.");
}

export async function cancelPurchaseOrder(formData: FormData) {
  const { supabase, org } = await requireOrg();
  const id = text(formData, "id");
  const { data: current } = await supabase
    .from("purchase_orders")
    .select("status")
    .eq("id", id)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!current || !["draft", "sent"].includes(current.status)) {
    fail("/purchasing", "That purchase order can no longer be cancelled.");
  }
  const { error } = await supabase
    .from("purchase_orders")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("org_id", org.id);
  if (error) fail("/purchasing", error.message);
  refreshOps();
  done("/purchasing", "Purchase order cancelled.");
}

export async function receivePurchaseOrder(formData: FormData) {
  const { supabase } = await requireOrg();
  const id = text(formData, "id");
  const { error } = await supabase.rpc("receive_purchase_order", { p_po_id: id });
  if (error) fail("/purchasing", error.message);
  refreshOps();
  done("/purchasing", "Goods received and stock updated.");
}

export async function createSale(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, org } = await requireOrg();
  const storeId = text(formData, "store_id");
  const customerId = text(formData, "customer_id");
  const channel = text(formData, "channel");
  const lines = linesFromForm(formData);
  if (!storeId) return { error: "Choose the fulfilling store." };
  if (!["store", "web", "marketplace"].includes(channel)) return { error: "Choose a channel." };
  if (lines.length === 0) return { error: "Add at least one line." };

  const { data, error } = await supabase.rpc("create_sale", {
    p_org_id: org.id,
    p_store_id: storeId,
    p_customer_id: customerId || null,
    p_channel: channel,
    p_lines: lines
  });
  if (error) return { error: error.message };

  const { data: order } = await supabase.from("sales_orders").select("number").eq("id", data).maybeSingle();
  refreshOps();
  done("/orders", `${order?.number ?? "Order"} fulfilled from store stock.`);
}

export async function voidSale(formData: FormData) {
  const { supabase } = await requireOrg();
  const id = text(formData, "id");
  const { error } = await supabase.rpc("void_sale", { p_order_id: id });
  if (error) fail("/orders", error.message);
  refreshOps();
  done("/orders", "Order voided and stock returned.");
}

export async function transferStock(formData: FormData) {
  const { supabase, org } = await requireOrg();
  const { error } = await supabase.rpc("transfer_stock", {
    p_org_id: org.id,
    p_sku_id: text(formData, "sku_id"),
    p_from_store: text(formData, "from_store"),
    p_to_store: text(formData, "to_store"),
    p_qty: Number(text(formData, "qty"))
  });
  if (error) fail("/reorder", error.message);
  refreshOps();
  done("/reorder", "Stock moved between stores.");
}

export async function raiseDraftOrders(formData: FormData) {
  const { supabase, org } = await requireOrg();
  const storeId = text(formData, "store_id");
  if (!storeId) fail("/reorder", "Choose the receiving store.");

  const since = new Date(Date.now() - 28 * 86_400_000).toISOString();
  const input = await planningInput(org.id, since);
  const rows = buildForecast(input).filter((row) => row.suggested > 0 && row.supplierId);
  if (rows.length === 0) done("/reorder", "Nothing to buy. On-hand stock and open purchase orders cover the forecast.");

  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.supplierId as string;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  const { count } = await supabase
    .from("purchase_orders")
    .select("id", { count: "exact", head: true })
    .eq("org_id", org.id);
  let sequence = 1001 + (count ?? 0);
  const expected = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

  for (const [supplierId, lines] of groups) {
    const number = `PO-${sequence}`;
    sequence += 1;
    const { data: order, error } = await supabase
      .from("purchase_orders")
      .insert({
        org_id: org.id,
        supplier_id: supplierId,
        store_id: storeId,
        number,
        status: "draft",
        expected_at: expected
      })
      .select("id")
      .single();
    if (error || !order) fail("/reorder", error?.message ?? "Could not draft a purchase order.");
    const { error: lineError } = await supabase.from("purchase_order_lines").insert(
      lines.map((line) => ({
        org_id: org.id,
        purchase_order_id: order.id,
        sku_id: line.skuId,
        qty: line.suggested,
        unit_cost: line.cost
      }))
    );
    if (lineError) {
      await supabase.from("purchase_orders").delete().eq("id", order.id);
      fail("/reorder", lineError.message);
    }
  }

  refreshOps();
  done("/purchasing", `Drafted ${groups.size} purchase order${groups.size === 1 ? "" : "s"} from the forecast.`);
}
