import { createIntegration, updateIntegration } from "@/app/actions/catalog";
import { Badge, Field, Flash, PageHeader, Panel, PrimarySubmit, buttonGhost, inputClass } from "@/components/ui";
import { listIntegrations } from "@/lib/queries";
import { requireOrg } from "@/lib/session";

export const metadata = { title: "Integrations" };

export default async function IntegrationsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const { org } = await requireOrg();
  const integrations = await listIntegrations(org.id);

  return (
    <>
      <PageHeader
        eyebrow="Retail systems"
        title="Outside systems"
        lede="Write down the registers, website, marketplace, and accounts package this chain uses. Aisle stores that list. Sales and receipts you enter here are the record those systems would send."
      />
      <Flash error={query.error} notice={query.notice} />
      <div className="grid gap-4 lg:grid-cols-2">
        {integrations.map((integration) => (
          <article key={integration.id} className="rounded-2xl border border-line bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{integration.system}</p>
                <h2 className="font-serif text-2xl">{integration.name}</h2>
              </div>
              <Badge tone={integration.status === "connected" ? "pine" : "copper"}>{integration.status}</Badge>
            </div>
            <form action={updateIntegration} className="mt-4 grid gap-3">
              <input type="hidden" name="id" value={integration.id} />
              <Field label="Endpoint">
                <input className={inputClass} name="endpoint" defaultValue={integration.endpoint} placeholder="https://" />
              </Field>
              <Field label="Status">
                <select className={inputClass} name="status" defaultValue={integration.status}>
                  <option value="connected">Connected</option>
                  <option value="disconnected">Disconnected</option>
                </select>
              </Field>
              <button className={buttonGhost} type="submit">Save connection</button>
            </form>
          </article>
        ))}
        <Panel title="Add a system">
          <form action={createIntegration} className="grid gap-3">
            <Field label="System">
              <input className={inputClass} name="system" required placeholder="WMS" />
            </Field>
            <Field label="Name">
              <input className={inputClass} name="name" required placeholder="Warehouse" />
            </Field>
            <Field label="Endpoint">
              <input className={inputClass} name="endpoint" placeholder="https://" />
            </Field>
            <Field label="Status">
              <select className={inputClass} name="status" defaultValue="disconnected">
                <option value="disconnected">Disconnected</option>
                <option value="connected">Connected</option>
              </select>
            </Field>
            <PrimarySubmit>Add system</PrimarySubmit>
          </form>
        </Panel>
      </div>
    </>
  );
}
