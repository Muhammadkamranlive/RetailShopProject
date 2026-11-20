import Link from "next/link";

export function AuthShell({
  title,
  lede,
  children,
  footer
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper md:grid md:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden bg-sidebar text-paper md:flex md:flex-col md:justify-between md:px-10 md:py-10">
        <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-pine/40 blur-3xl" />
        <Link href="/" className="relative font-serif text-3xl tracking-tight">
          Aisle
        </Link>
        <div className="relative max-w-md">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-brass">Retail operations</p>
          <p className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight">
            One ledger for every shop, every sale, and the next order.
          </p>
          <p className="mt-5 text-sm leading-6 text-[#c5d0cb]">
            Buyers, store managers, and the floor share the same stock. Open a company, add stores, or load the Harbor &amp; Rye sample.
          </p>
        </div>
        <p className="relative text-xs text-[#8d9a94]">Stock changes only on a sale, receipt, void, or transfer.</p>
      </aside>
      <main className="flex min-h-screen flex-col justify-center px-6 py-16">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="font-serif text-3xl md:hidden">
            Aisle
          </Link>
          <h1 className="mt-8 font-serif text-4xl tracking-tight md:mt-0">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted">{lede}</p>
          <div className="mt-8 rounded-xl border border-line bg-card p-6 shadow-[0_16px_40px_-28px_rgba(11,18,16,0.45)]">{children}</div>
          <div className="mt-4 text-sm text-muted">{footer}</div>
        </div>
      </main>
    </div>
  );
}
