import { getSession } from "@/lib/session";
import { num } from "@/lib/format";
import type { ForecastInbound, ForecastLevel, ForecastSale, ForecastSku } from "@/lib/forecast";

type QueryError = { message: string } | null;

function friendly(message: string) {
  if (message.includes("memberships") || message.includes("schema cache") || message.includes("does not exist")) {
    return "The Aisle tables are not in this Supabase project yet. Run supabase/migrations/20260929120000_init.sql in the SQL editor, then reload.";
  }
  return message;
}

async function must<T>(query: PromiseLike<{ data: T; error: QueryError }>) {
  const { data, error } = await query;
  if (error) throw new Error(friendly(error.message));
  return data;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function db() {
  const session = await getSession();
  if (!session.supabase) throw new Error("Sign in to load this screen.");
  return session.supabase;
}

export async function listMembers(orgId: string) {
  const supabase = await db();
  const { data, error } = await supabase.rpc("list_company_members", { p_org_id: orgId });
  if (error) throw new Error(friendly(error.message));
  return ((data ?? []) as { email: string | null; full_name: string | null; role: string; joined_at: string }[]).map((row) => ({
    email: row.email ?? "",
    name: row.full_name ?? "",
    role: row.role,
    joinedAt: row.joined_at
  }));
}

export async function listStores(orgId: string) {
  const supabase = await db();
  const rows = await must(
    supabase
      .from("stores")
      .select("id, code, name, city, region, format, status")
      .eq("org_id", orgId)
      .order("code")
  );
  return rows ?? [];
}

export async function listShifts(orgId: string) {
  const supabase = await db();
  const rows = await must(
    supabase
      .from("shifts")
      .select("id, store_id, status, opening_float, closing_cash, opened_at, closed_at, store:stores(name, code)")
      .eq("org_id", orgId)
      .order("opened_at", { ascending: false })
      .limit(12)
  );
  return (rows ?? []).map((row) => {
    const store = one(row.store as { name: string; code: string } | { name: string; code: string }[] | null);
    return {
      id: row.id as string,
      storeId: row.store_id as string,
      storeName: store?.name ?? "Store",
      storeCode: store?.code ?? "",
      status: row.status as string,
      openingFloat: num(row.opening_float),
      closingCash: row.closing_cash == null ? null : num(row.closing_cash),
      openedAt: row.opened_at as string,
      closedAt: (row.closed_at as string | null) ?? null
    };
  });
}

export async function listCategories(orgId: string) {
  const supabase = await db();
  const rows = await must(
    supabase.from("categories").select("id, name").eq("org_id", orgId).order("name")
  );
  return rows ?? [];
}

export async function listSuppliers(orgId: string) {
  const supabase = await db();
  const rows = await must(
    supabase
      .from("suppliers")
      .select("id, name, email, lead_time_days")
      .eq("org_id", orgId)
      .order("name")
  );
  return (rows ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    email: (row.email as string | null) ?? "",
    leadTimeDays: num(row.lead_time_days)
  }));
}

export async function listSkus(orgId: string) {
  const supabase = await db();
  const rows = await must(
    supabase
      .from("skus")
      .select("id, sku, barcode, name, cost, price, reorder_point, reorder_qty, supplier_id, supplier:suppliers(name, lead_time_days), product:products(brand, category:categories(name))")
      .eq("org_id", orgId)
      .order("name")
  );
  return (rows ?? []).map((row) => {
    const supplier = one(row.supplier as { name: string; lead_time_days: number } | { name: string; lead_time_days: number }[] | null);
    const product = one(
      row.product as
        | { brand: string | null; category: { name: string } | { name: string }[] | null }
        | { brand: string | null; category: { name: string } | { name: string }[] | null }[]
        | null
    );
    const category = product ? one(product.category) : null;
    return {
      id: row.id as string,
      sku: row.sku as string,
      barcode: (row.barcode as string | null) ?? "",
      name: row.name as string,
      brand: product?.brand ?? "",
      category: category?.name ?? "",
      cost: num(row.cost),
      price: num(row.price),
      reorderPoint: num(row.reorder_point),
      reorderQty: num(row.reorder_qty),
      supplierId: (row.supplier_id as string | null) ?? null,
      supplierName: supplier?.name ?? null,
      leadTimeDays: supplier ? num(supplier.lead_time_days) : 5
    };
  });
}

export async function listCustomers(orgId: string) {
  const supabase = await db();
  const rows = await must(
    supabase.from("customers").select("id, name, email, phone").eq("org_id", orgId).order("name")
  );
  return (rows ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    email: (row.email as string | null) ?? "",
    phone: (row.phone as string | null) ?? ""
  }));
}

export async function listIntegrations(orgId: string) {
  const supabase = await db();
  const rows = await must(
    supabase
      .from("integrations")
      .select("id, system, name, status, endpoint")
      .eq("org_id", orgId)
      .order("system")
  );
  return (rows ?? []).map((row) => ({
    id: row.id as string,
    system: row.system as string,
    name: row.name as string,
    status: row.status as string,
    endpoint: (row.endpoint as string | null) ?? ""
  }));
}

export async function listLevels(orgId: string) {
  const supabase = await db();
  const rows = await must(
    supabase
      .from("inventory_levels")
      .select("on_hand, store_id, sku_id, store:stores(name, code), sku:skus(sku, name, reorder_point, price)")
      .eq("org_id", orgId)
  );
  return (rows ?? []).map((row) => {
    const store = one(row.store as { name: string; code: string } | { name: string; code: string }[] | null);
    const sku = one(
      row.sku as
        | { sku: string; name: string; reorder_point: number; price: number }
        | { sku: string; name: string; reorder_point: number; price: number }[]
        | null
    );
    return {
      storeId: row.store_id as string,
      storeName: store?.name ?? "Store",
      storeCode: store?.code ?? "",
      skuId: row.sku_id as string,
      sku: sku?.sku ?? "",
      name: sku?.name ?? "",
      reorderPoint: sku ? num(sku.reorder_point) : 0,
      price: sku ? num(sku.price) : 0,
      onHand: num(row.on_hand)
    };
  });
}

export async function listMovements(orgId: string) {
  const supabase = await db();
  const rows = await must(
    supabase
      .from("inventory_movements")
      .select("id, qty, movement_type, reference, created_at, store:stores(code), sku:skus(sku, name)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(40)
  );
  return (rows ?? []).map((row) => {
    const store = one(row.store as { code: string } | { code: string }[] | null);
    const sku = one(row.sku as { sku: string; name: string } | { sku: string; name: string }[] | null);
    return {
      id: row.id as string,
      qty: num(row.qty),
      type: row.movement_type as string,
      reference: row.reference as string,
      createdAt: row.created_at as string,
      storeCode: store?.code ?? "",
      sku: sku?.sku ?? "",
      name: sku?.name ?? ""
    };
  });
}

export type PurchaseOrder = {
  id: string;
  number: string;
  status: string;
  expectedAt: string | null;
  supplierName: string;
  storeName: string;
  storeCode: string;
  total: number;
  lines: { sku: string; name: string; qty: number; unitCost: number; qtyReceived: number }[];
};

export async function listPurchaseOrders(orgId: string): Promise<PurchaseOrder[]> {
  const supabase = await db();
  const rows = await must(
    supabase
      .from("purchase_orders")
      .select("id, number, status, expected_at, supplier:suppliers(name), store:stores(name, code), lines:purchase_order_lines(qty, unit_cost, qty_received, sku:skus(sku, name))")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
  );
  return (rows ?? []).map((row) => {
    const supplier = one(row.supplier as { name: string } | { name: string }[] | null);
    const store = one(row.store as { name: string; code: string } | { name: string; code: string }[] | null);
    const lines = (row.lines as {
      qty: number;
      unit_cost: number;
      qty_received: number;
      sku: { sku: string; name: string } | { sku: string; name: string }[] | null;
    }[] | null) ?? [];
    const mapped = lines.map((line) => {
      const sku = one(line.sku);
      return {
        sku: sku?.sku ?? "",
        name: sku?.name ?? "",
        qty: num(line.qty),
        unitCost: num(line.unit_cost),
        qtyReceived: num(line.qty_received)
      };
    });
    return {
      id: row.id as string,
      number: row.number as string,
      status: row.status as string,
      expectedAt: (row.expected_at as string | null) ?? null,
      supplierName: supplier?.name ?? "Supplier",
      storeName: store?.name ?? "Store",
      storeCode: store?.code ?? "",
      total: mapped.reduce((sum, line) => sum + line.qty * line.unitCost, 0),
      lines: mapped
    };
  });
}

export type SalesOrder = {
  id: string;
  number: string;
  channel: string;
  status: string;
  total: number;
  placedAt: string;
  storeName: string;
  storeCode: string;
  customerId: string | null;
  customerName: string | null;
  lines: { name: string; qty: number; unitPrice: number }[];
};

export async function listSalesOrders(orgId: string, since?: string): Promise<SalesOrder[]> {
  const supabase = await db();
  let query = supabase
    .from("sales_orders")
    .select("id, number, channel, status, total, placed_at, customer_id, store:stores(name, code), customer:customers(name), lines:sales_order_lines(qty, unit_price, sku:skus(name))")
    .eq("org_id", orgId)
    .order("placed_at", { ascending: false });
  if (since) query = query.gte("placed_at", since);
  const rows = await must(query.limit(since ? 500 : 40));
  return (rows ?? []).map((row) => {
    const store = one(row.store as { name: string; code: string } | { name: string; code: string }[] | null);
    const customer = one(row.customer as { name: string } | { name: string }[] | null);
    const lines = (row.lines as {
      qty: number;
      unit_price: number;
      sku: { name: string } | { name: string }[] | null;
    }[] | null) ?? [];
    return {
      id: row.id as string,
      number: row.number as string,
      channel: row.channel as string,
      status: row.status as string,
      total: num(row.total),
      placedAt: row.placed_at as string,
      storeName: store?.name ?? "Store",
      storeCode: store?.code ?? "",
      customerId: (row.customer_id as string | null) ?? null,
      customerName: customer?.name ?? null,
      lines: lines.map((line) => ({
        name: one(line.sku)?.name ?? "Item",
        qty: num(line.qty),
        unitPrice: num(line.unit_price)
      }))
    };
  });
}

export async function planningInput(orgId: string, sinceIso: string) {
  const supabase = await db();
  const [skuRows, levelRows, orderRows, poRows, storeRows] = await Promise.all([
    must(
      supabase
        .from("skus")
        .select("id, sku, name, cost, reorder_point, reorder_qty, supplier_id, supplier:suppliers(name, lead_time_days)")
        .eq("org_id", orgId)
    ),
    must(
      supabase
        .from("inventory_levels")
        .select("store_id, sku_id, on_hand, store:stores(name)")
        .eq("org_id", orgId)
    ),
    must(
      supabase
        .from("sales_orders")
        .select("status, lines:sales_order_lines(sku_id, qty)")
        .eq("org_id", orgId)
        .eq("status", "fulfilled")
        .gte("placed_at", sinceIso)
    ),
    must(
      supabase
        .from("purchase_orders")
        .select("status, lines:purchase_order_lines(sku_id, qty, qty_received)")
        .eq("org_id", orgId)
        .eq("status", "sent")
    ),
    must(supabase.from("stores").select("id").eq("org_id", orgId).eq("status", "active"))
  ]);

  const skus: ForecastSku[] = (skuRows ?? []).map((row) => {
    const supplier = one(
      row.supplier as { name: string; lead_time_days: number } | { name: string; lead_time_days: number }[] | null
    );
    return {
      id: row.id as string,
      sku: row.sku as string,
      name: row.name as string,
      cost: num(row.cost),
      reorderPoint: num(row.reorder_point),
      reorderQty: num(row.reorder_qty),
      supplierId: (row.supplier_id as string | null) ?? null,
      supplierName: supplier?.name ?? null,
      leadTimeDays: supplier ? num(supplier.lead_time_days) : 5
    };
  });

  const levels: ForecastLevel[] = (levelRows ?? []).map((row) => {
    const store = one(row.store as { name: string } | { name: string }[] | null);
    return {
      storeId: row.store_id as string,
      storeName: store?.name ?? "Store",
      skuId: row.sku_id as string,
      onHand: num(row.on_hand)
    };
  });

  const sales: ForecastSale[] = [];
  for (const order of orderRows ?? []) {
    const lines = (order.lines as { sku_id: string; qty: number }[] | null) ?? [];
    for (const line of lines) sales.push({ skuId: line.sku_id, qty: num(line.qty) });
  }

  const inbound: ForecastInbound[] = [];
  for (const order of poRows ?? []) {
    const lines = (order.lines as { sku_id: string; qty: number; qty_received: number }[] | null) ?? [];
    for (const line of lines) {
      const remaining = num(line.qty) - num(line.qty_received);
      if (remaining > 0) inbound.push({ skuId: line.sku_id, qty: remaining });
    }
  }

  return { skus, levels, sales, inbound, storeCount: (storeRows ?? []).length };
}
