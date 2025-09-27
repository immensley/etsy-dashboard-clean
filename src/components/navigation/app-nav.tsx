"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Listing Inspector" },
  { href: "/admin", label: "Admin" },
  { href: "/sections", label: "Sections" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.32em] text-white">
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
          MCP ORBIT
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Button key={item.href} asChild variant={isActive ? "primary" : "outline"} size="sm">
                <Link href={item.href}>
                  {item.label}
                  {isActive && <Badge className="ml-2 border-none bg-emerald-500/30 text-emerald-100">Live</Badge>}
                </Link>
              </Button>
            );
          })}
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
