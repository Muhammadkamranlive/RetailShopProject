import Link from "next/link";
import { Flash, PageHeader, Table, Td, Th } from "@/components/ui";
import { when } from "@/lib/format";
import { listLevels, listMovements, listStores } from "@/lib/queries";
import { requireOrg } from "@/lib/session";

export const metadata = { title: "Inventory" };

export default async function InventoryPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; notice?: string; store?: string }>;
}) {
  const query = await searchParams;
  const { org } = await requireOrg();
  const [stores, levels, movements] = await Promise.all([
    listStores(org.id),
    listLevels(org.id),
    listMovements(org.id)
  ]);
  const visible = levels
    .filter((level) => !query.store || level.storeId === query.store)
    .sort((a, b) => a.storeCode.localeCompare(b.storeCode) || a.name.localeCompare(b.name));

  return (
    <>
      <PageHeader
        eyebrow="Stock"
        title="Units on each shelf"
        lede="Each row is one product in one shop. Red means that shop is at or under its reorder point. The list below is the history: receipts add units, sales remove them, transfers move them between shops."
      />
      <Flash error={query.error} notice={query.notice} />
      <div className="mb-4 flex gap-2 overflow-x-auto text-sm">
        <Link className={`rounded-full px-3 py-1 ${!query.store ? "bg-ink text-paper" : "bg-card border border-line"}`} href="/inventory">
          All stores
        </Link>
        {stores.map((store) => (
          <Link
            key={store.id}
            className={`whitespace-nowrap rounded-full px-3 py-1 ${query.store === store.id ? "bg-ink text-paper" : "border border-line bg-card"}`}
            href={`/inventory?store=${store.id}`}
          >
            {store.code}
          </Link>
        ))}
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Store</Th>
            <Th>Product</Th>
            <Th className="text-right">On hand</Th>
            <Th className="text-right">Reorder</Th>
          </tr>
        </thead>
        <tbody>
          {visible.map((level) => {
            const short = level.onHand <= level.reorderPoint;
            return (
              <tr key={`${level.storeId}-${level.skuId}`}>
                <Td>{level.storeCode}</Td>
                <Td>
                  {level.name}
                  <span className="mt-0.5 block text-xs text-muted">{level.sku}</span>
                </Td>
                <Td className={`text-right ${short ? "font-medium text-copper" : ""}`}>{level.onHand}</Td>
                <Td className="text-right text-muted">{level.reorderPoint}</Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <h2 className="mb-3 mt-8 font-serif text-2xl">Latest movements</h2>
      <Table>
        <thead>
          <tr>
            <Th>When</Th>
            <Th>Store</Th>
            <Th>Product</Th>
            <Th>Type</Th>
            <Th>Reference</Th>
            <Th className="text-right">Qty</Th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr key={movement.id}>
              <Td>{when(movement.createdAt)}</Td>
              <Td>{movement.storeCode}</Td>
              <Td>{movement.name}</Td>
              <Td>{movement.type}</Td>
              <Td>{movement.reference}</Td>
              <Td className={`text-right ${movement.qty < 0 ? "text-copper" : "text-pine-dark"}`}>
                {movement.qty > 0 ? `+${movement.qty}` : movement.qty}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
