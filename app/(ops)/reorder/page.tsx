import { raiseDraftOrders, transferStock } from "@/app/actions/commerce";
import { Flash, PageHeader, PrimarySubmit, Table, Td, Th, buttonGhost, inputClass } from "@/components/ui";
import { buildForecast, buildTransfers } from "@/lib/forecast";
import { money } from "@/lib/format";
import { listStores, planningInput } from "@/lib/queries";
import { requireOrg } from "@/lib/session";

export const metadata = { title: "Reorder" };

export default async function ReorderPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const { org } = await requireOrg();
  const since = new Date(Date.now() - 28 * 86_400_000).toISOString();
  const [stores, input] = await Promise.all([listStores(org.id), planningInput(org.id, since)]);
  const forecast = buildForecast(input).filter((row) => row.suggested > 0);
  const transfers = buildTransfers(input);
  const buyCost = forecast.reduce((sum, row) => sum + row.suggested * row.cost, 0);

  return (
    <>
      <PageHeader
        eyebrow="Automation"
        title="Move stock before you buy more"
        lede="The first table is spare stock that can travel from a full shop to a short one. The second table is what the chain still needs to buy. Draft purchase orders sends those lines to Purchasing for someone to review."
      />
      <Flash error={query.error} notice={query.notice} />

      <h2 className="mb-3 font-serif text-2xl">Move stock first</h2>
      {transfers.length === 0 ? (
        <p className="mb-8 text-sm text-muted">No store is short while another still has units above the reorder point.</p>
      ) : (
        <div className="mb-8">
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th className="text-right">Units</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {transfers.map((transfer) => (
                <tr key={`${transfer.skuId}-${transfer.fromStoreId}-${transfer.toStoreId}`}>
                  <Td>{transfer.name}</Td>
                  <Td>{transfer.fromStoreName}</Td>
                  <Td>{transfer.toStoreName}</Td>
                  <Td className="text-right">{transfer.qty}</Td>
                  <Td className="text-right">
                    <form action={transferStock}>
                      <input type="hidden" name="sku_id" value={transfer.skuId} />
                      <input type="hidden" name="from_store" value={transfer.fromStoreId} />
                      <input type="hidden" name="to_store" value={transfer.toStoreId} />
                      <input type="hidden" name="qty" value={transfer.qty} />
                      <button className={buttonGhost} type="submit">Move</button>
                    </form>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <h2 className="mb-3 font-serif text-2xl">Then buy {money(buyCost, org.currency)}</h2>
      <Table>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Supplier</Th>
            <Th className="text-right">Suggested</Th>
          </tr>
        </thead>
        <tbody>
          {forecast.length === 0 ? (
            <tr>
              <Td className="text-muted">Open purchase orders and stock on hand cover the forecast.</Td>
              <Td /><Td />
            </tr>
          ) : (
            forecast.map((row) => (
              <tr key={row.skuId}>
                <Td>{row.name}</Td>
                <Td>{row.supplierName ?? "Assign a supplier on the catalog"}</Td>
                <Td className="text-right">{row.suggested}</Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      {stores.length > 0 && forecast.length > 0 ? (
        <form action={raiseDraftOrders} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Receive into</span>
            <select className={inputClass} name="store_id" defaultValue={stores[0]?.id}>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>
          <PrimarySubmit>Draft purchase orders</PrimarySubmit>
        </form>
      ) : null}
    </>
  );
}
