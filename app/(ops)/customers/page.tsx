import { createCustomer } from "@/app/actions/catalog";
import { Badge, Field, Flash, PageHeader, Panel, PrimarySubmit, Table, Td, Th, inputClass } from "@/components/ui";
import { journey, segment } from "@/lib/customers";
import { day, money } from "@/lib/format";
import { listCustomers, listSalesOrders } from "@/lib/queries";
import { requireOrg } from "@/lib/session";

export const metadata = { title: "Customers" };

function segmentTone(value: string) {
  if (value === "Loyal") return "pine" as const;
  if (value === "Lapsed") return "copper" as const;
  if (value === "Active") return "gold" as const;
  return "ink" as const;
}

export default async function CustomersPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const { org } = await requireOrg();
  const [customers, orders] = await Promise.all([
    listCustomers(org.id),
    listSalesOrders(org.id, "2020-01-01T00:00:00.000Z")
  ]);

  const rows = customers.map((customer) => {
    const history = orders.filter((order) => order.customerId === customer.id && order.status === "fulfilled");
    const last = history.map((order) => order.placedAt).sort().at(-1) ?? null;
    return {
      ...customer,
      orders: history.length,
      spend: history.reduce((sum, order) => sum + order.total, 0),
      last,
      segment: segment(history.length, last),
      journey: journey(history.map((order) => order.channel))
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Customer journey"
        title="Who is still shopping"
        lede="A customer is Loyal after three purchases with one in the last 30 days. Lapsed means no purchase for 45 days. The journey line shows whether they buy in the shop, on the website, or on a marketplace."
      />
      <Flash error={query.error} notice={query.notice} />
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <Panel title="Add a customer">
          <form action={createCustomer} className="grid gap-3">
            <Field label="Name">
              <input className={inputClass} name="name" required />
            </Field>
            <Field label="Email">
              <input className={inputClass} name="email" type="email" />
            </Field>
            <Field label="Phone">
              <input className={inputClass} name="phone" />
            </Field>
            <PrimarySubmit>Save customer</PrimarySubmit>
          </form>
        </Panel>
        <Table>
          <thead>
            <tr>
              <Th>Customer</Th>
              <Th>Segment</Th>
              <Th>Journey</Th>
              <Th className="text-right">Orders</Th>
              <Th className="text-right">Spend</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((customer) => (
              <tr key={customer.id}>
                <Td>
                  {customer.name}
                  <span className="mt-0.5 block text-xs text-muted">
                    {customer.email || "No email"} · last {day(customer.last)}
                  </span>
                </Td>
                <Td>
                  <Badge tone={segmentTone(customer.segment)}>{customer.segment}</Badge>
                </Td>
                <Td>{customer.journey}</Td>
                <Td className="text-right">{customer.orders}</Td>
                <Td className="text-right">{money(customer.spend, org.currency)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
}
