import { voidSale } from "@/app/actions/commerce";
import { OrderForm } from "@/components/record-forms";
import { Badge, Flash, PageHeader, Panel, buttonDanger } from "@/components/ui";
import { money, titleCase, when } from "@/lib/format";
import { listCustomers, listLevels, listSalesOrders, listSkus, listStores } from "@/lib/queries";
import { requireOrg } from "@/lib/session";

export const metadata = { title: "Orders" };

function channelTone(channel: string) {
  if (channel === "store") return "pine" as const;
  if (channel === "marketplace") return "gold" as const;
  return "ink" as const;
}

export default async function OrdersPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const { org } = await requireOrg();
  const [stores, customers, skus, levels, orders] = await Promise.all([
    listStores(org.id),
    listCustomers(org.id),
    listSkus(org.id),
    listLevels(org.id),
    listSalesOrders(org.id)
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Unified commerce"
        title="Sales from every channel"
        lede="Record a sale here. Choose the shop that gives up the stock, and whether the customer bought in the shop, on the website, or on a marketplace. If that shop does not have enough units, the sale is refused."
      />
      <Flash error={query.error} notice={query.notice} />
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <Panel title="New order">
          {stores.length === 0 || skus.length === 0 ? (
            <p className="text-sm text-muted">Add a store and a product with stock before selling.</p>
          ) : (
            <OrderForm stores={stores} customers={customers} skus={skus} levels={levels} />
          )}
        </Panel>
        <div className="space-y-3">
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-line bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{order.number}</p>
                  <p className="text-sm text-muted">
                    {order.storeName} · {order.customerName ?? "No customer profile"} · {when(order.placedAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge tone={channelTone(order.channel)}>{titleCase(order.channel)}</Badge>
                  <Badge tone={order.status === "fulfilled" ? "pine" : "copper"}>{titleCase(order.status)}</Badge>
                </div>
              </div>
              <ul className="mt-3 text-sm text-muted">
                {order.lines.map((line, index) => (
                  <li key={`${order.id}-${index}`}>
                    {line.qty} × {line.name}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm">{money(order.total, org.currency)}</p>
                {order.status === "fulfilled" ? (
                  <form action={voidSale}>
                    <input type="hidden" name="id" value={order.id} />
                    <button className={buttonDanger} type="submit">Void and return stock</button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
