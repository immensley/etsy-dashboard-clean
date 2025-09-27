"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import type { SectionDashboardData, SectionMetadata } from "@/lib/section-dashboard-service";
import { fetchSectionDashboardAction } from "@/lib/section-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SectionDashboardClientProps {
  shopId: string;
  metadata: SectionMetadata[];
  initialData: SectionDashboardData;
}

export function SectionDashboardClient({ shopId, metadata, initialData }: SectionDashboardClientProps) {
  const [activeSection, setActiveSection] = useState(initialData.sectionId);
  const [dataset, setDataset] = useState<SectionDashboardData>(initialData);
  const [isPending, startTransition] = useTransition();

  const sections = useMemo(
    () => [
      { sectionId: "all", title: "All listings", activeCount: initialData.summary.total },
      ...metadata,
    ],
    [metadata, initialData.summary.total],
  );

  const handleChange = (value: string) => {
    if (value === activeSection) {
      return;
    }
    setActiveSection(value);
    startTransition(async () => {
      const data = await fetchSectionDashboardAction(shopId, value === "all" ? undefined : value);
      setDataset(data);
    });
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <LoadingOverlay show={isPending} label="Syncing section data" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="space-y-4">
          <Badge className="border-none bg-sky-500/20 px-3 py-1 text-xs uppercase tracking-[0.32em] text-sky-200">
            Section catalog intelligence
          </Badge>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold leading-tight text-white">Browse {dataset.listings.length} listings</h1>
              <p className="max-w-2xl text-sm text-white/70">
                Tap through sections to monitor inventory health, pricing, and availability across the shop catalog.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.28em] text-white/40">
              Last sync: {new Date(dataset.generatedAt).toLocaleString()}
            </div>
          </div>
        </header>

        <Tabs value={activeSection} onValueChange={handleChange} className="grid gap-6">
          <TabsList className="w-full flex-wrap justify-start gap-2 border border-white/10 bg-white/5 p-2">
            {sections.map((section) => (
              <TabsTrigger
                key={section.sectionId}
                value={section.sectionId}
                className="rounded-xl px-4 py-2 text-xs uppercase tracking-[0.24em]"
              >
                {section.title}
                <span className="ml-2 rounded-full bg-white/10 px-2 py-[2px] text-[10px]">
                  {section.activeCount ?? ""}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeSection} className="grid gap-6">
            <Card className="border-white/10 bg-gradient-to-br from-white/5 via-transparent to-slate-900/70 p-6 shadow-[0_24px_90px_rgba(56,189,248,0.18)]">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Listings" value={dataset.summary.total} description="Rows returned" />
                <Metric
                  label="Active"
                  value={`${dataset.summary.active}/${dataset.summary.total}`}
                  description="Marked active"
                />
                <Metric
                  label="Avg price"
                  value={
                    dataset.summary.averagePrice !== null
                      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                          dataset.summary.averagePrice,
                        )
                      : "—"
                  }
                  description="Across section"
                />
                <Metric label="Low stock" value={dataset.summary.lowStock} description="Quantity &lt; 5" />
              </div>
            </Card>

            <Card className="border-white/10 bg-slate-900/75 p-0">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">Listings</h2>
                  <p className="text-xs text-white/40">Scroll to review all entries. Use search (⌘/Ctrl+F) to jump quickly.</p>
                </div>
                {isPending && <span className="text-xs text-emerald-200">Syncing…</span>}
              </div>
              <div className="max-h-[60vh] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Signals</TableHead>
                  <TableHead>Traffic</TableHead>
                  <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataset.listings.map((listing) => {
                      const signals: ReactNode[] = [];
                      const quantity = typeof listing.quantity === "number" ? listing.quantity : Number(listing.quantity);
                      if (Number.isFinite(quantity) && quantity < 5) {
                        signals.push(
                          <Badge key="low" className="border-none bg-amber-500/20 text-amber-100">
                            Low stock
                          </Badge>,
                        );
                      }
                      if (listing.flags?.is_bestseller) {
                        signals.push(
                          <Badge key="bestseller" className="border-none bg-emerald-500/20 text-emerald-100">
                            Bestseller
                          </Badge>,
                        );
                      }
                      if (listing.flags?.is_customizable) {
                        signals.push(
                          <Badge key="custom" className="border-none bg-sky-500/20 text-sky-100">
                            Customizable
                          </Badge>,
                        );
                      }

                      return (
                        <TableRow key={listing.listing_id} className="text-white/80">
                          <TableCell>
                            <div className="flex flex-col">
                              <a
                                href={typeof listing.url === "string" ? listing.url : undefined}
                                target="_blank"
                              rel="noreferrer"
                              className="font-medium text-white hover:text-emerald-200"
                            >
                              {listing.title ?? listing.listing_id}
                            </a>
                            {listing.shop?.shop_name && (
                              <span className="text-xs text-white/50">{listing.shop.shop_name}</span>
                            )}
                          </div>
                        </TableCell>
                          <TableCell>{listing.pricing?.display ?? listing.price ?? "—"}</TableCell>
                          <TableCell>{listing.quantity ?? "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {signals.length ? signals : <span className="text-white/40">—</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {listing.engagement?.in_cart_count ?? listing.engagement?.shop_total_rating_count ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                listing.state === "active"
                                  ? "border-none bg-emerald-500/20 text-emerald-100"
                                  : "border-none bg-amber-500/20 text-amber-100"
                              }
                            >
                              {listing.state ?? "—"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Metric({ label, value, description }: { label: string; value: string | number; description?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
      <p className="text-xs uppercase tracking-[0.32em] text-white/50">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {description && <p className="text-xs text-white/50">{description}</p>}
    </div>
  );
}
