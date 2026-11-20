"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SideNav } from "@/components/side-nav";

export function Shell({
  orgName,
  email,
  role,
  collapsed: initialCollapsed,
  children
}: {
  orgName: string;
  email: string;
  role: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [open, setOpen] = useState(false);
  const compact = collapsed && !open;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `aisle-nav=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <div className={`min-h-screen bg-paper text-ink lg:grid ${collapsed ? "lg:grid-cols-[76px_1fr]" : "lg:grid-cols-[248px_1fr]"}`}>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-[#0b1210]/50 lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-white/10 bg-sidebar text-paper transition-transform duration-200 lg:static lg:translate-x-0 ${
          collapsed ? "lg:w-[76px]" : "lg:w-[248px]"
        } ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className={`flex items-center border-b border-white/10 ${compact ? "justify-center px-2 py-4" : "justify-between gap-2 px-4 py-4"}`}>
          <Link href="/home" className="min-w-0" title="Aisle">
            <span className="font-serif text-2xl leading-none tracking-tight">{compact ? "A" : "Aisle"}</span>
            {compact ? null : <span className="mt-1 block truncate text-xs text-[#b7c4be]">{orgName}</span>}
          </Link>
          {compact ? null : (
            <button
              type="button"
              className="hidden h-8 w-8 items-center justify-center rounded-md text-[#c5d0cb] hover:bg-white/10 lg:inline-flex"
              aria-label="Collapse sidebar"
              onClick={toggleCollapsed}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-3">
          <SideNav compact={compact} />
        </div>
        <div className={`border-t border-white/10 ${compact ? "px-2 py-3" : "px-4 py-4"}`}>
          {compact ? (
            <button
              type="button"
              className="flex h-10 w-full items-center justify-center rounded-md text-[#c5d0cb] hover:bg-white/10"
              aria-label="Expand sidebar"
              title="Expand sidebar"
              onClick={toggleCollapsed}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <>
              <p className="truncate text-xs text-[#d7e0dc]">{email}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-[#8d9a94]">{role.replaceAll("_", " ")}</p>
              <form action="/auth/signout" method="post" className="mt-3">
                <button className="text-sm text-[#f4f7f6] underline-offset-4 hover:underline" type="submit">
                  Sign out
                </button>
              </form>
            </>
          )}
        </div>
      </aside>
      <div className="min-w-0">
        <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-card px-3 text-sm"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
          <p className="truncate text-sm font-medium">{orgName}</p>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-muted underline-offset-4 hover:underline" type="submit">
              Sign out
            </button>
          </form>
        </div>
        <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      </div>
    </div>
  );
}
