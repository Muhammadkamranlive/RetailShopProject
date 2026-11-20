import { buildForecast } from "@/lib/forecast";
import { Flash, PageHeader, Table, Td, Th } from "@/components/ui";
import { money } from "@/lib/format";
import { planningInput } from "@/lib/queries";
import { requireOrg } from "@/lib/session";

export const metadata = { title: "Forecast" };

export default async function ForecastPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const { org } = await requireOrg();
  const since = new Date(Date.now() - 28 * 86_400_000).toISOString();
  const rows = buildForecast(await planningInput(org.id, since));
  const peak = Math.max(...rows.map((row) => row.soldQty), 1);

  return (
    <>
      <PageHeader
        eyebrow="Demand"
        title="How much to buy"
        lede="Buy is the number of units to order for the whole chain. It looks at the last 28 days of sales, keeps a safety buffer in every shop, and subtracts stock already on the shelf or already sent by a supplier."
      />
      <Flash error={query.error} notice={query.notice} />
      <Table>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>28-day sales</Th>
            <Th className="text-right">Per day</Th>
            <Th className="text-right">On hand</Th>
            <Th className="text-right">Inbound</Th>
            <Th className="text-right">Buy</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.skuId}>
              <Td>
                {row.name}
                <span className="mt-0.5 block text-xs text-muted">
                  {row.supplierName ?? "No supplier"} · {row.coverDays} day cover
                </span>
              </Td>
              <Td>
                <div className="h-2 w-28 overflow-hidden rounded-full bg-line">
                  <div className="h-full bg-pine" style={{ width: `${(row.soldQty / peak) * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted">{row.soldQty} units</p>
              </Td>
              <Td className="text-right">{row.daily.toFixed(1)}</Td>
              <Td className="text-right">{row.onHand}</Td>
              <Td className="text-right">{row.inbound}</Td>
              <Td className="text-right">
                {row.suggested}
                <span className="mt-0.5 block text-xs text-muted">{money(row.suggested * row.cost, org.currency)}</span>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
