import Link from "next/link";
import { loadDemo } from "@/app/actions/network";
import { Badge, Flash, PageHeader, PrimarySubmit, Stat, Table, Td, Th } from "@/components/ui";
import { money, titleCase, when } from "@/lib/format";
import { listLevels, listPurchaseOrders, listSalesOrders, listShifts, listStores } from "@/lib/queries";
import { requireOrg } from "@/lib/session";

export const metadata = { title: "Overview" };

function channelTone(channel: string) {
  if (channel === "store") return "pine" as const;
  if (channel === "marketplace") return "gold" as const;
  return "ink" as const;
}

export default async function OverviewPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const { org } = await requireOrg();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [stores, orders, levels, purchaseOrders, shifts] = await Promise.all([
    listStores(org.id),
    listSalesOrders(org.id, since),
    listLevels(org.id),
    listPurchaseOrders(org.id),
    listShifts(org.id)
  ]);

  if (stores.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow={org.name}
          title={`Set up ${org.name}`}
          lede="This screen is the weekly picture: sales, short shelves, and open purchase orders. It stays empty until the company has at least one store."
        />
        <Flash error={query.error} notice={query.notice} />
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-line bg-card p-5">
            <h2 className="font-serif text-2xl">Start with your own stores</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Add a store, then products and a supplier. Stock appears when a purchase order is received. Sales from the shop floor, the website, and a marketplace all draw from that store.
            </p>
            <ol className="mt-4 space-y-2 text-sm leading-6 text-ink">
              <li>1. Add a store on Stores.</li>
              <li>2. Add products on Catalog, then a supplier on Purchasing.</li>
              <li>3. Receive a purchase order. That is the step that puts units on the shelf.</li>
            </ol>
            <Link className="mt-5 inline-flex rounded-md bg-pine px-4 py-2 text-sm font-medium text-white" href="/stores">
              Add the first store
            </Link>
          </section>
          <section className="rounded-2xl border border-dashed border-line p-5">
            <h2 className="font-serif text-2xl">Or load a sample grocer</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Harbor &amp; Rye is optional practice data: four shops, a grocery catalog, suppliers, and a month of sales. Use it to learn the screens, then replace it with the real company.
            </p>
            <form action={loadDemo} className="mt-5">
              <PrimarySubmit>Load Harbor &amp; Rye</PrimarySubmit>
            </form>
          </section>
        </div>
      </>
    );
  }

  const fulfilled = orders.filter((order) => order.status === "fulfilled");
  const sales = fulfilled.reduce((sum, order) => sum + order.total, 0);
  const byChannel = { store: 0, web: 0, marketplace: 0 };
  for (const order of fulfilled) {
    if (order.channel === "store" || order.channel === "web" || order.channel === "marketplace") {
      byChannel[order.channel] += order.total;
    }
  }
  const channelTotal = Math.max(sales, 1);
  const shortages = levels.filter((level) => level.onHand <= level.reorderPoint);
  const low = [...shortages].sort((a, b) => a.onHand - b.onHand).slice(0, 8);
  const openPurchases = purchaseOrders.filter((order) => order.status === "draft" || order.status === "sent");
  const openShifts = shifts.filter((shift) => shift.status === "open");
  const demand = new Map<string, number>();
  for (const order of fulfilled) {
    for (const line of order.lines) demand.set(line.name, (demand.get(line.name) ?? 0) + line.qty);
  }
  const top = [...demand.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow={org.name}
        title="This week across the chain"
        lede="Read this page from the top. The numbers are the last seven days. Red stock means a shop is at or under its reorder point. Open purchases are orders that have not been received yet."
      />
      <Flash error={query.error} notice={query.notice} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Sales, 7 days" value={money(sales, org.currency)} hint={`${fulfilled.length} fulfilled orders`} />
        <Stat label="Stores" value={String(stores.length)} hint={`${openShifts.length} shift${openShifts.length === 1 ? "" : "s"} open`} />
        <Stat label="Below reorder" value={String(shortages.length)} hint="Positions under the reorder point" />
        <Stat label="Open purchases" value={String(openPurchases.length)} hint="Drafts and orders sent to suppliers" />
      </div>

      <section className="mt-8 rounded-2xl border border-line bg-card p-5">
        <h2 className="text-sm font-medium">Where the money came from</h2>
        <p className="mt-1 text-xs text-muted">Green is the shop floor. Black is the website. Copper is a marketplace. All three reduce stock in a shop.</p>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-line">
          <div className="bg-pine" style={{ width: `${(byChannel.store / channelTotal) * 100}%` }} />
          <div className="bg-ink" style={{ width: `${(byChannel.web / channelTotal) * 100}%` }} />
          <div className="bg-copper" style={{ width: `${(byChannel.marketplace / channelTotal) * 100}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted">
          Store {money(byChannel.store, org.currency)} · Web {money(byChannel.web, org.currency)} · Marketplace {money(byChannel.marketplace, org.currency)}
        </p>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-serif text-2xl">Short on the shelf</h2>
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Store</Th>
                <Th className="text-right">On hand</Th>
              </tr>
            </thead>
            <tbody>
              {low.length === 0 ? (
                <tr>
                  <Td className="text-muted">Every store is above its reorder point.</Td>
                  <Td /><Td />
                </tr>
              ) : (
                low.map((level) => (
                  <tr key={`${level.storeId}-${level.skuId}`}>
                    <Td>{level.name}</Td>
                    <Td>{level.storeCode}</Td>
                    <Td className="text-right text-copper">{level.onHand}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </section>
        <section>
          <h2 className="mb-3 font-serif text-2xl">Selling this week</h2>
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th className="text-right">Units</Th>
              </tr>
            </thead>
            <tbody>
              {top.length === 0 ? (
                <tr>
                  <Td className="text-muted">No fulfilled sales in the last seven days.</Td>
                  <Td />
                </tr>
              ) : (
                top.map(([name, qty]) => (
                  <tr key={name}>
                    <Td>{name}</Td>
                    <Td className="text-right">{qty}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </section>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-serif text-2xl">Latest orders</h2>
          <Link className="text-sm text-pine-dark underline-offset-4 hover:underline" href="/orders">
            All orders
          </Link>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Channel</Th>
              <Th>Store</Th>
              <Th>When</Th>
              <Th className="text-right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 8).map((order) => (
              <tr key={order.id}>
                <Td>{order.number}</Td>
                <Td>
                  <Badge tone={channelTone(order.channel)}>{titleCase(order.channel)}</Badge>
                </Td>
                <Td>{order.storeCode}</Td>
                <Td>{when(order.placedAt)}</Td>
                <Td className="text-right">{money(order.total, org.currency)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>
    </>
  );
}
