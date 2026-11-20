"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-6 py-24">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Aisle</p>
      <h1 className="mt-2 font-serif text-4xl">Something needs attention</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{error.message}</p>
      <button
        className="mt-6 rounded-full bg-pine px-4 py-2 text-sm text-white"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </main>
  );
}
