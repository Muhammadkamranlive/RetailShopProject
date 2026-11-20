import { closeShift, createStore, openShift } from "@/app/actions/network";
import { Badge, Field, Flash, PageHeader, Panel, PrimarySubmit, Table, Td, Th, buttonGhost, inputClass } from "@/components/ui";
import { money, titleCase, when } from "@/lib/format";
import { listShifts, listStores } from "@/lib/queries";
import { requireOrg } from "@/lib/session";

export const metadata = { title: "Stores" };

export default async function StoresPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const { org } = await requireOrg();
  const [stores, shifts] = await Promise.all([listStores(org.id), listShifts(org.id)]);
  const openByStore = new Map(shifts.filter((shift) => shift.status === "open").map((shift) => [shift.storeId, shift]));

  return (
    <>
      <PageHeader
        eyebrow="Store network"
        title="Shops in this chain"
        lede="A shop is a place that holds stock and can take a sale. Open a shift when the team is on the floor. Website and marketplace orders still ship from one of these shops."
      />
      <Flash error={query.error} notice={query.notice} />
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <Panel title="Add a store">
          <form action={createStore} className="grid gap-3">
            <Field label="Code">
              <input className={inputClass} name="code" required placeholder="HM-05" />
            </Field>
            <Field label="Name">
              <input className={inputClass} name="name" required placeholder="Harbor Market" />
            </Field>
            <Field label="City">
              <input className={inputClass} name="city" required />
            </Field>
            <Field label="Region">
              <input className={inputClass} name="region" required placeholder="Oregon" />
            </Field>
            <Field label="Format">
              <select className={inputClass} name="format" defaultValue="store">
                <option value="store">Store</option>
                <option value="supermarket">Supermarket</option>
                <option value="hypermarket">Hypermarket</option>
                <option value="convenience">Convenience</option>
                <option value="department">Department</option>
                <option value="outlet">Outlet</option>
                <option value="warehouse">Warehouse</option>
              </select>
            </Field>
            <PrimarySubmit>Add store</PrimarySubmit>
          </form>
        </Panel>
        <div className="space-y-3">
          {stores.map((store) => {
            const shift = openByStore.get(store.id);
            return (
              <article key={store.id} className="rounded-2xl border border-line bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">{store.code}</p>
                    <h2 className="font-serif text-2xl">{store.name}</h2>
                    <p className="text-sm text-muted">
                      {store.city}, {store.region} · {titleCase(store.format)}
                    </p>
                  </div>
                  <Badge tone={shift ? "pine" : "ink"}>{shift ? "Shift open" : "No open shift"}</Badge>
                </div>
                {shift ? (
                  <form action={closeShift} className="mt-4 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="shift_id" value={shift.id} />
                    <Field label="Closing cash">
                      <input className={inputClass} name="closing_cash" type="number" min="0" step="0.01" defaultValue="0" />
                    </Field>
                    <button className={buttonGhost} type="submit">
                      Close shift
                    </button>
                    <p className="pb-2 text-xs text-muted">Opened {when(shift.openedAt)} · float {money(shift.openingFloat, org.currency)}</p>
                  </form>
                ) : (
                  <form action={openShift} className="mt-4 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="store_id" value={store.id} />
                    <Field label="Opening float">
                      <input className={inputClass} name="opening_float" type="number" min="0" step="0.01" defaultValue="200" />
                    </Field>
                    <button className={buttonGhost} type="submit">
                      Open shift
                    </button>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
