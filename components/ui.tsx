import { SubmitButton } from "@/components/submit-button";

export const buttonClass =
  "inline-flex items-center justify-center rounded-md bg-pine px-4 py-2 text-sm font-medium text-white transition hover:bg-pine-dark disabled:opacity-60";
export const buttonGhost =
  "inline-flex items-center justify-center rounded-md border border-line bg-card px-4 py-2 text-sm font-medium text-ink transition hover:border-ink/40 disabled:opacity-60";
export const buttonDanger =
  "inline-flex items-center justify-center rounded-md border border-copper/30 px-3 py-1.5 text-xs font-medium text-copper hover:bg-copper/10 disabled:opacity-60";
export const inputClass =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none ring-pine/20 placeholder:text-muted/70 focus:border-pine focus:ring-2";
export const labelClass = "mb-1 block text-xs font-medium uppercase tracking-wide text-muted";

export function PageHeader({ eyebrow, title, lede }: { eyebrow: string; title: string; lede: string }) {
  return (
    <header className="mb-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">{eyebrow}</p>
      <h1 className="mt-1 font-serif text-4xl tracking-tight text-ink">{title}</h1>
      <p className="mt-4 max-w-2xl border-l-2 border-pine pl-4 text-sm leading-6 text-muted">{lede}</p>
    </header>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-card px-5 py-4 shadow-[0_1px_0_rgba(16,20,18,0.04)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-card p-4 shadow-[0_1px_0_rgba(16,20,18,0.04)]">
      <h2 className="mb-3 text-sm font-medium text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-card shadow-[0_1px_0_rgba(16,20,18,0.04)]">
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children = null, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`border-b border-line px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children = null, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`border-b border-line/80 px-3 py-2.5 align-middle ${className}`}>{children}</td>;
}

const tones = {
  pine: "bg-[#e5f3ee] text-[#0b5340]",
  copper: "bg-[#f8e8e1] text-[#8a3d1f]",
  ink: "bg-[#efeae2] text-[#3c3833]",
  gold: "bg-[#f4ecd2] text-[#6d5420]"
};

export function Badge({ children, tone = "ink" }: { children: React.ReactNode; tone?: keyof typeof tones }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Flash({ error, notice }: { error?: string; notice?: string }) {
  return (
    <>
      {error ? <p className="mb-4 rounded-xl bg-[#f8e8e1] px-3 py-2 text-sm text-copper">{error}</p> : null}
      {notice ? <p className="mb-4 rounded-xl bg-[#e5f3ee] px-3 py-2 text-sm text-pine-dark">{notice}</p> : null}
    </>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
      <h2 className="font-serif text-3xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export function PrimarySubmit({ children }: { children: React.ReactNode }) {
  return <SubmitButton className={buttonClass}>{children}</SubmitButton>;
}
