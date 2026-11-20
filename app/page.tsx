import Link from "next/link";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const jobs = [
  {
    index: "01",
    title: "Stock the shops",
    body: "A purchase order asks a supplier to deliver into one shop. Stock does not change when the order is sent. It changes when the delivery is received.",
    points: ["Suppliers and lead times", "Draft, send, and receive", "Units land on one shop’s shelf"]
  },
  {
    index: "02",
    title: "Sell from any channel",
    body: "The shop floor, the website, and a marketplace all draw from the same shelves. The sale names the shop that gives up the units. If that shop is short, the sale is refused.",
    points: ["Store, web, and marketplace", "One stock balance per shop", "Customer history from real purchases"]
  },
  {
    index: "03",
    title: "Replenish with a reason",
    body: "The forecast uses the last 28 days of sales. Spare stock moves from a full shop to a short one before anyone raises a purchase order.",
    points: ["Short shelves in red", "Transfers between shops", "Draft orders a buyer can still edit"]
  }
];

const screens = [
  ["Overview", "What sold this week, and which shelves are already short."],
  ["Stores", "The shops in the chain, and whether a shift is open."],
  ["Catalog", "The shared product list: price, cost, supplier. Not the stock."],
  ["Inventory", "Units of each product in each shop, and the movement ledger."],
  ["Purchasing", "Orders to suppliers. Receiving is the step that adds stock."],
  ["Orders", "Sales from the floor, the website, and the marketplace."],
  ["Customers", "Who is still buying, and through which channel."],
  ["Forecast", "A buy quantity for the whole chain, after inbound orders."],
  ["Reorder", "Move spare stock first. Draft the purchases that remain."],
  ["Integrations", "The registers, website, marketplace, and accounts package."]
];

const shelves = [
  { shop: "Harbor Market", place: "Portland · supermarket", milk: "64", oil: "4", note: "Can spare milk" },
  { shop: "Rye Street", place: "Portland · convenience", milk: "4", oil: "4", note: "Short on milk" },
  { shop: "Dockside", place: "Seattle · supermarket", milk: "38", oil: "4", note: "Can spare milk" },
  { shop: "Mill Court", place: "Seattle · convenience", milk: "4", oil: "4", note: "Short on milk" }
];

export default async function Home() {
  const configured = isSupabaseConfigured();
  let signedIn = false;
  if (configured) {
    const supabase = await createClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    signedIn = Boolean(session?.user);
  }
  const enter = signedIn ? "/home" : "/signup";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-sidebar/95 text-paper backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3.5">
          <a href="#top" className="flex items-baseline gap-3">
            <span className="font-serif text-2xl leading-none tracking-tight">Aisle</span>
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-brass sm:inline">Retail operations</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-[#c5d0cb] md:flex">
            <a className="hover:text-white" href="#jobs">How it works</a>
            <a className="hover:text-white" href="#sample">Sample chain</a>
            <a className="hover:text-white" href="#screens">Screens</a>
            <a className="hover:text-white" href="#start">Start</a>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            {signedIn ? (
              <Link className="rounded-md bg-white px-3.5 py-2 font-medium text-sidebar" href="/home">
                Open the chain
              </Link>
            ) : (
              <>
                <Link className="hidden text-[#c5d0cb] hover:text-white sm:inline" href="/login">
                  Sign in
                </Link>
                <Link className="rounded-md bg-brass px-3.5 py-2 font-medium text-sidebar" href="/signup">
                  Open the sample
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden bg-sidebar text-paper">
          <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-pine/50 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-brass/15 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-20">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-brass">Store networks · any retailer</p>
              <h1 className="mt-4 max-w-xl font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl">
                One ledger for every shop, every sale, and the next order.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-[#c5d0cb]">
                Aisle is the operations system for a retailer that runs more than one store. Buyers, store
                managers, and the person on the floor work from the same stock, the same catalog, and the same purchase orders.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-sidebar" href={enter}>
                  {signedIn ? "Go to this week" : "Create an account"}
                </Link>
                <a className="rounded-md border border-white/20 px-5 py-2.5 text-sm text-paper" href="#sample">
                  Read the Harbor &amp; Rye example
                </a>
              </div>
              <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                {[
                  ["4", "Shops in the sample"],
                  ["3", "Selling channels"],
                  ["1", "Way stock can change"]
                ].map(([value, label]) => (
                  <div key={label}>
                    <dd className="font-serif text-3xl text-brass">{value}</dd>
                    <dt className="mt-1 text-xs leading-5 text-[#8d9a94]">{label}</dt>
                  </div>
                ))}
              </dl>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-card text-ink shadow-[0_30px_80px_-24px_rgba(0,0,0,0.55)]">
              <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Harbor &amp; Rye · this week</p>
                <span className="rounded-full bg-pine/10 px-2 py-0.5 text-[11px] font-medium text-pine">Sample</span>
              </div>
              <div className="grid gap-px bg-line sm:grid-cols-3">
                {[
                  ["Sales", "$4,280", "Store, web, marketplace"],
                  ["Short shelves", "14", "At or under reorder"],
                  ["Open buys", "2", "Sent or still a draft"]
                ].map(([label, value, hint]) => (
                  <div key={label} className="bg-white px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{label}</p>
                    <p className="mt-2 font-serif text-3xl tracking-tight">{value}</p>
                    <p className="mt-1 text-xs text-muted">{hint}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white px-4 py-4">
                <div className="flex h-2 overflow-hidden rounded-full bg-line">
                  <div className="w-[58%] bg-pine" />
                  <div className="w-[27%] bg-ink" />
                  <div className="w-[15%] bg-brass" />
                </div>
                <p className="mt-2 text-xs text-muted">Shop floor · Website · Marketplace</p>
                <ul className="mt-4 divide-y divide-line text-sm">
                  <li className="flex items-center justify-between py-2.5">
                    <span>Rye Street · Whole milk</span>
                    <span className="rounded-full bg-[#f8e8e1] px-2 py-0.5 text-xs font-medium text-copper">4 on hand</span>
                  </li>
                  <li className="flex items-center justify-between py-2.5">
                    <span>Mill Court · Eggs</span>
                    <span className="rounded-full bg-[#f8e8e1] px-2 py-0.5 text-xs font-medium text-copper">4 on hand</span>
                  </li>
                  <li className="flex items-center justify-between py-2.5">
                    <span>All shops · Olive oil</span>
                    <span className="rounded-full bg-[#f4ecd2] px-2 py-0.5 text-xs font-medium text-[#6d5420]">Buy 48</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-pine">The operating problem</p>
              <h2 className="mt-3 font-serif text-4xl leading-tight tracking-tight">A chain cannot run from four separate lists.</h2>
            </div>
            <p className="text-base leading-7 text-muted">
              The catalog says what you sell. Each shop says what is actually there. Purchasing says what is already
              on the way. Sales say what left the shelf, including the website and the marketplace. Aisle keeps those
              four facts on one ledger, so a buyer can see a shortage before it becomes an empty shelf.
            </p>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
            {[
              ["Catalog", "What the chain sells", "Name, price, cost, supplier. Shared by every shop."],
              ["Shelf", "What a shop holds", "On-hand units, per product, per shop. Red when short."],
              ["Document", "What changed the stock", "A receipt, a sale, a void, or a transfer. Nothing else."]
            ].map(([title, line, body]) => (
              <article key={title} className="bg-white p-6">
                <h3 className="font-serif text-2xl">{title}</h3>
                <p className="mt-1 text-sm font-medium">{line}</p>
                <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="jobs" className="border-y border-line bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">How the work is organized</p>
            <h2 className="mt-3 max-w-2xl font-serif text-4xl leading-tight">Three jobs. Every screen belongs to one of them.</h2>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {jobs.map((job) => (
                <article key={job.index} className="flex flex-col rounded-xl border border-line bg-paper p-6 shadow-[0_1px_0_rgba(16,22,20,0.04)]">
                  <p className="font-serif text-sm text-brass">{job.index}</p>
                  <h3 className="mt-3 font-serif text-3xl tracking-tight">{job.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-muted">{job.body}</p>
                  <ul className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
                    {job.points.map((point) => (
                      <li key={point} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-pine" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="sample" className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Worked example</p>
              <h2 className="mt-3 font-serif text-4xl leading-tight">Harbor &amp; Rye, this morning.</h2>
              <p className="mt-4 text-sm leading-7 text-muted">
                Four shops in Portland and Seattle. The two convenience shops are down to four cartons of milk. The
                two supermarkets still have stock. Olive oil is at four units in every shop, and no purchase order
                covers it yet. That is the decision the product is built to surface.
              </p>
              <ol className="mt-6 space-y-4 text-sm leading-6">
                <li>
                  <span className="font-medium">Move milk.</span>{" "}
                  <span className="text-muted">Harbor Market can cover Rye Street. Dockside can cover Mill Court.</span>
                </li>
                <li>
                  <span className="font-medium">Buy oil.</span>{" "}
                  <span className="text-muted">The forecast drafts a purchase order to Pantry Wholesale. A person still sends it.</span>
                </li>
                <li>
                  <span className="font-medium">Keep selling.</span>{" "}
                  <span className="text-muted">New orders, from any channel, fail if the chosen shop cannot fill them.</span>
                </li>
              </ol>
            </div>
            <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[0_16px_40px_-28px_rgba(11,18,16,0.4)]">
              <div className="grid grid-cols-[1.4fr_0.6fr_0.6fr] bg-sidebar px-4 py-3 text-[11px] uppercase tracking-[0.14em] text-[#c5d0cb]">
                <span>Shop</span>
                <span className="text-right">Milk</span>
                <span className="text-right">Oil</span>
              </div>
              {shelves.map((row) => (
                <div key={row.shop} className="grid grid-cols-[1.4fr_0.6fr_0.6fr] items-center border-b border-line px-4 py-3 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium">{row.shop}</p>
                    <p className="text-xs text-muted">{row.place}</p>
                  </div>
                  <p className={`text-right text-sm ${Number(row.milk) <= 4 ? "font-medium text-copper" : ""}`}>{row.milk}</p>
                  <p className="text-right text-sm font-medium text-copper">{row.oil}</p>
                </div>
              ))}
              <p className="bg-paper px-4 py-3 text-xs leading-5 text-muted">
                Reorder point is 12. Red numbers are already under it. The sample loads these balances when you choose Harbor &amp; Rye.
              </p>
            </div>
          </div>
        </section>

        <section id="screens" className="border-y border-line bg-sidebar text-paper">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8d9a94]">Inside the product</p>
            <h2 className="mt-3 max-w-xl font-serif text-4xl leading-tight">Ten screens. Each one answers a single question.</h2>
            <div className="mt-10 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
              {screens.map(([name, body], index) => (
                <div key={name} className="bg-sidebar px-5 py-5">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#8d9a94]">{String(index + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 font-serif text-2xl">{name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#c5d0cb]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="start" className="border-b border-line bg-white">
          <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-pine">Start</p>
          <h2 className="mt-3 max-w-2xl font-serif text-4xl tracking-tight">Open the sample before you enter your own shops.</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Create an account", "You own the company. On a hosted project, confirm email if that setting is on."],
              ["Name the company", "Set the retailer name, currency, and country. Stores come next."],
              ["Add stores, or load a sample", "Enter your own shops, or load Harbor & Rye to practice on grocery data."]
            ].map(([title, body], index) => (
              <li key={title} className="rounded-xl border border-line bg-paper p-5">
                <p className="font-serif text-3xl text-pine">{index + 1}</p>
                <h3 className="mt-3 text-lg font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
              </li>
            ))}
          </ol>
          {!configured ? (
            <p className="mt-6 max-w-2xl rounded-md border border-line bg-white px-4 py-3 text-sm leading-6 text-muted">
              The local database is not connected. Start Docker, then run <code>supabase start</code> in this project.
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded-md bg-pine px-5 py-2.5 text-sm font-medium text-white" href={enter}>
              {signedIn ? "Continue into the chain" : "Create an account"}
            </Link>
            <Link className="rounded-md border border-line bg-paper px-5 py-2.5 text-sm" href="/login">
              Sign in
            </Link>
          </div>
          </div>
        </section>
      </main>

      <footer className="bg-sidebar text-[#c5d0cb]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 py-10 text-sm">
          <div>
            <p className="font-serif text-2xl text-white">Aisle</p>
            <p className="mt-1">Retail operations for a store network.</p>
          </div>
          <p className="max-w-xs text-[#8d9a94]">Stock moves only when a sale, receipt, void, or transfer is posted.</p>
        </div>
      </footer>
    </div>
  );
}
