"use client";

import React, { useTransition } from "react";
import type { AdminDashboardData } from "@/lib/admin-dashboard-types";
import { refreshAdminDashboardAction } from "@/lib/admin-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { logoutAction } from "@/lib/auth-actions";
import { useRouter } from "next/navigation";

interface AdminDashboardClientProps {
  data: AdminDashboardData;
}

export function AdminDashboardClient({ data }: AdminDashboardClientProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshAdminDashboardAction();
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.replace("/login");
    });
  };

  const paletteByAccent: Record<string, string> = {
    emerald: "from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-400/30",
    sky: "from-sky-500/15 via-sky-500/5 to-transparent border-sky-400/30",
    rose: "from-rose-500/15 via-rose-500/5 to-transparent border-rose-400/30",
    amber: "from-amber-500/15 via-amber-500/5 to-transparent border-amber-400/30",
  };

  const timeline = data.listings.map((listing) => {
    let detail = "Listing healthy";
    if (listing.status === "error") {
      detail = listing.error ?? "MCP error";
    } else if (listing.status === "inactive") {
      detail = "Listing marked inactive on Etsy.";
    } else if (listing.lowStockCount > 0) {
      detail = `${listing.lowStockCount} variant${listing.lowStockCount === 1 ? "" : "s"} below threshold.`;
    }

    detail = `${detail} Behavior: ${listing.behaviorLabel} (${Math.round(listing.behaviorScore)})`;
    if (listing.behaviorAlerts.length > 0) {
      detail += ` · ${listing.behaviorAlerts.join(", ")}`;
    }

    return {
      label: listing.label,
      status: listing.status,
      detail,
      timestamp: listing.lastSync,
    };
  });

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_55%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <Badge className="border-none bg-emerald-500/20 px-3 py-1 text-xs uppercase tracking-[0.32em] text-emerald-200">
              Admin Control Center
            </Badge>
            <h1 className="text-4xl font-semibold leading-tight text-white">Operational Pulseboard</h1>
            <p className="max-w-2xl text-sm text-white/70">
              Monitor critical Etsy listings, MCP health, and stock signals in one Notion-inspired workspace.
            </p>
            <p className="text-xs uppercase tracking-[0.26em] text-white/40">
              Last sync: {new Date(data.generatedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <a href="/sections">View catalog</a>
            </Button>
            <Button onClick={handleRefresh} variant="primary" size="sm" disabled={isPending}>
              {isPending ? "Syncing…" : "Refresh MCPs"}
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="sm">
              Logout
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.summary.map((metric) => (
            <Card
              key={metric.label}
              className={`border bg-gradient-to-br p-6 shadow-[0_24px_80px_rgba(56,189,248,0.18)] ${paletteByAccent[metric.accent ?? "emerald"] ?? "border-white/10 from-slate-900/70 via-white/5 to-transparent"}`}
            >
              <p className="text-xs uppercase tracking-[0.32em] text-white/50">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
              {metric.description && <p className="mt-1 text-xs text-white/50">{metric.description}</p>}
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/10 bg-slate-900/75 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">Monitored listings</h2>
              <Badge className="border-none bg-white/10 text-white/60">{data.listings.length} URLs</Badge>
            </div>
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Behavior</TableHead>
                  <TableHead>Alerts</TableHead>
                  <TableHead>Low Stock</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Last Sync</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.listings.map((listing) => {
                  const tone = listing.status === "active" ? "text-emerald-200" : listing.status === "inactive" ? "text-amber-200" : "text-rose-200";
                  const pills: React.ReactNode[] = [];
                  if (listing.status === "error") {
                    pills.push(
                      <Badge key="error" className="border-none bg-rose-500/20 text-rose-100">
                        MCP error
                      </Badge>,
                    );
                  }
                  if (listing.status === "inactive") {
                    pills.push(
                      <Badge key="inactive" className="border-none bg-amber-500/20 text-amber-100">
                        Inactive
                      </Badge>,
                    );
                  }
                  if (listing.lowStockCount > 0) {
                    pills.push(
                      <Badge key="low" className="border-none bg-amber-500/20 text-amber-100">
                        {listing.lowStockCount} low
                      </Badge>,
                    );
                  }
                  return (
                    <TableRow key={listing.listingId} className="text-white/80">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-white">{listing.label}</span>
                          <span className="text-xs text-white/50">{listing.listingId}</span>
                        </div>
                      </TableCell>
                      <TableCell className={tone}>
                        {listing.status === "active" && "Active"}
                        {listing.status === "inactive" && "Review"}
                        {listing.status === "error" && "Error"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            listing.behaviorLabel === "Hero"
                              ? "border-none bg-emerald-500/20 text-emerald-100"
                              : listing.behaviorLabel === "Steady"
                                ? "border-none bg-sky-500/20 text-sky-100"
                                : "border-none bg-amber-500/20 text-amber-100"
                          }
                        >
                          {listing.behaviorLabel} · {Math.round(listing.behaviorScore)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {pills.length ? pills : <span className="text-white/40">—</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {listing.lowStockCount > 0 ? (
                          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-100">
                            {listing.lowStockCount}
                          </span>
                        ) : (
                          <span className="text-white/40">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {listing.data?.shopName ? (
                          <a
                            href={listing.data.shopUrl ?? "#"}
                            target={listing.data.shopUrl ? "_blank" : undefined}
                            rel={listing.data.shopUrl ? "noreferrer" : undefined}
                            className="text-sm text-emerald-200/80 hover:text-emerald-200"
                          >
                            {listing.data.shopName}
                          </a>
                        ) : (
                          <span className="text-white/40">—</span>
                        )}
                      </TableCell>
                      <TableCell>{listing.priceDisplay ?? listing.data?.price ?? "—"}</TableCell>
                      <TableCell className="text-xs text-white/50">
                        {new Date(listing.lastSync).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          <div className="grid gap-6">
            <Card className="border-white/10 bg-slate-900/75 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">Alerts & automations</h2>
              <div className="mt-4 space-y-4">
                {data.alerts.map((alert, index) => {
                  const palette =
                    alert.type === "success"
                      ? "from-emerald-500/15 to-emerald-500/5 border-emerald-400/30"
                      : alert.type === "info"
                        ? "from-sky-500/15 to-sky-500/5 border-sky-400/30"
                        : "from-rose-500/15 to-rose-500/5 border-rose-400/30";
                  return (
                    <div
                      key={`${alert.headline}-${index}`}
                      className={`rounded-2xl border ${palette} bg-gradient-to-br px-4 py-4 shadow-[0_18px_60px_rgba(56,189,248,0.15)]`}
                    >
                      <p className="text-sm font-semibold text-white">{alert.headline}</p>
                      <p className="text-xs text-white/60">{alert.detail}</p>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="border-white/10 bg-slate-900/75 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">Ops timeline</h2>
              <div className="mt-4 space-y-3">
                {timeline.map((item, index) => {
                  const accent =
                    item.status === "active"
                      ? "bg-emerald-500/30"
                      : item.status === "inactive"
                        ? "bg-amber-500/30"
                        : "bg-rose-500/30";
                  return (
                    <div key={`${item.label}-${index}`} className="flex items-start gap-3">
                      <span className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${accent}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-xs text-white/50">{item.detail}</p>
                      </div>
                      <span className="text-xs text-white/40">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="border-white/10 bg-slate-900/75 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">Stock watchlist</h2>
              {data.lowStockListings.length ? (
                <div className="mt-4 space-y-3">
                  {data.lowStockListings.map((listing) => (
                    <div key={listing.listingId} className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">{listing.label}</p>
                        <span className="rounded-full bg-amber-500/30 px-3 py-1 text-xs text-amber-100">
                          {listing.lowStockCount} low
                        </span>
                      </div>
                      <p className="text-xs text-white/60">
                        {listing.variantsTotal} variants tracked · {listing.priceDisplay ?? listing.data?.price ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-white/50">No low stock listings detected.</p>
              )}
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
