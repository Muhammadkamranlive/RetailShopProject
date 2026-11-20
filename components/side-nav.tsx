"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const groups = [
  {
    title: "Today",
    links: [
      { href: "/home", label: "Overview", icon: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" },
      { href: "/stores", label: "Stores", icon: "M4 20V9l8-5 8 5v11M9 20v-6h6v6" }
    ]
  },
  {
    title: "Sell",
    links: [
      { href: "/orders", label: "Orders", icon: "M7 4h10l1 3H6l1-3zM6 7h12l-1 13H7L6 7z" },
      { href: "/customers", label: "Customers", icon: "M16 19v-1a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v1M10 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 19v-1a2.5 2.5 0 0 0-2-2.45M16 6.1a2.5 2.5 0 0 1 0 4.8" }
    ]
  },
  {
    title: "Stock",
    links: [
      { href: "/catalog", label: "Catalog", icon: "M5 6h14M5 12h14M5 18h14" },
      { href: "/inventory", label: "Inventory", icon: "M3 8l9-4 9 4-9 4-9-4zM3 12l9 4 9-4M3 16l9 4 9-4" },
      { href: "/purchasing", label: "Purchasing", icon: "M3 7h13l2 4v6H3V7zM7 17a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM15 17a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" }
    ]
  },
  {
    title: "Plan",
    links: [
      { href: "/forecast", label: "Forecast", icon: "M4 19V5M4 19h16M8 15l3-4 3 2 4-6" },
      { href: "/reorder", label: "Reorder", icon: "M7 7h11l-3-3M17 17H6l3 3" }
    ]
  },
  {
    title: "Company",
    links: [
      { href: "/integrations", label: "Integrations", icon: "M9 8V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3M8 8h8v11H8V8zM10 12h4" },
      { href: "/company", label: "Company", icon: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" }
    ]
  }
];

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SideNav({ compact }: { compact: boolean }) {
  const pathname = usePathname();
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  return (
    <nav className={compact ? "space-y-1 px-2" : "space-y-4 px-3"} aria-label="Workspace">
      {groups.map((group) => {
        const folded = !compact && closed[group.title];
        return (
          <div key={group.title}>
            {compact ? null : (
              <button
                type="button"
                className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#8d9a94]"
                aria-expanded={!folded}
                onClick={() => setClosed((current) => ({ ...current, [group.title]: !current[group.title] }))}
              >
                {group.title}
                <svg viewBox="0 0 24 24" className={`h-3 w-3 transition ${folded ? "-rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" />
                </svg>
              </button>
            )}
            {folded ? null : (
              <div className={compact ? "space-y-1" : "mt-1 space-y-0.5"}>
                {group.links.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      title={link.label}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center rounded-md text-sm font-medium ${
                        compact ? "justify-center px-0 py-2.5" : "gap-2.5 px-2.5 py-2"
                      } ${active ? "bg-white text-[#0b1210]" : "text-[#d7e0dc] hover:bg-white/10"}`}
                    >
                      <Glyph d={link.icon} />
                      {compact ? <span className="sr-only">{link.label}</span> : <span>{link.label}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
