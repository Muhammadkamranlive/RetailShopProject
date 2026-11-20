import { cancelPurchaseOrder, receivePurchaseOrder, sendPurchaseOrder } from "@/app/actions/commerce";
import { createSupplier } from "@/app/actions/catalog";
import { PurchaseOrderForm } from "@/components/record-forms";
import { Badge, Field, Flash, PageHeader, Panel, PrimarySubmit, buttonDanger, buttonGhost, inputClass } from "@/components/ui";
import { day, money, titleCase } from "@/lib/format";
import { listPurchaseOrders, listSkus, listStores, listSuppliers } from "@/lib/queries";
import { requireOrg } from "@/lib/session";

export const metadata = { title: "Purchasing" };

function tone(status: string) {
  if (status === "received") return "pine" as const;
  if (status === "cancelled") return "copper" as const;
  if (status === "sent") return "gold" as const;
  return "ink" as const;
}

export default async function PurchasingPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const { org } = await requireOrg();
  const [suppliers, stores, skus, orders] = await Promise.all([
    listSuppliers(org.id),
    listStores(org.id),
    listSkus(org.id),
    listPurchaseOrders(org.id)
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Procurement"
        title="Buying from suppliers"
        lede="A purchase order asks a supplier to send goods to one shop. Sending it does not change stock. Choose Receive goods when the delivery arrives. That is the step that puts units on the shelf."
      />
      <Flash error={query.error} notice={query.notice} />
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <Panel title="New purchase order">
            {suppliers.length === 0 || stores.length === 0 || skus.length === 0 ? (
              <p className="text-sm text-muted">Add a supplier, a store, and a product first.</p>
            ) : (
              <PurchaseOrderForm suppliers={suppliers} stores={stores} skus={skus} />
            )}
          </Panel>
          <Panel title="Supplier">
            <form action={createSupplier} className="grid gap-3">
              <Field label="Name">
                <input className={inputClass} name="name" required />
              </Field>
              <Field label="Email">
                <input className={inputClass} name="email" type="email" />
              </Field>
              <Field label="Lead time, days">
                <input className={inputClass} name="lead_time_days" type="number" min="0" defaultValue="5" />
              </Field>
              <PrimarySubmit>Add supplier</PrimarySubmit>
            </form>
          </Panel>
        </div>
        <div className="space-y-3">
          {suppliers.length > 0 ? (
            <p className="text-sm text-muted">
              {suppliers.map((supplier) => `${supplier.name} · ${supplier.leadTimeDays}d`).join("  ·  ")}
            </p>
          ) : null}
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-line bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{order.number}</p>
                  <p className="text-sm text-muted">
                    {order.supplierName} → {order.storeName} · expected {day(order.expectedAt)}
                  </p>
                </div>
                <Badge tone={tone(order.status)}>{titleCase(order.status)}</Badge>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {order.lines.map((line) => (
                  <li key={line.sku} className="flex justify-between gap-3">
                    <span>
                      {line.name} · {line.qty} × {money(line.unitCost, org.currency)}
                    </span>
                    <span className="text-muted">{line.qtyReceived} received</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">{money(order.total, org.currency)}</p>
                <div className="flex gap-2">
                  {order.status === "draft" ? (
                    <form action={sendPurchaseOrder}>
                      <input type="hidden" name="id" value={order.id} />
                      <button className={buttonGhost} type="submit">Send</button>
                    </form>
                  ) : null}
                  {order.status === "sent" ? (
                    <form action={receivePurchaseOrder}>
                      <input type="hidden" name="id" value={order.id} />
                      <button className={buttonGhost} type="submit">Receive goods</button>
                    </form>
                  ) : null}
                  {order.status === "draft" || order.status === "sent" ? (
                    <form action={cancelPurchaseOrder}>
                      <input type="hidden" name="id" value={order.id} />
                      <button className={buttonDanger} type="submit">Cancel</button>
                    </form>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
