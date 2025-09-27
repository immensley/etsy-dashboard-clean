"use client";

import { useState, useTransition } from "react";
import { fetchListingDashboardAction } from "@/lib/listing-actions";
import type { ListingDashboardData } from "@/lib/listing-dashboard-types";
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

interface ListingDashboardClientProps {
  initialData?: ListingDashboardData | null;
  initialListing?: string;
}

export function ListingDashboardClient({ initialData = null, initialListing = "" }: ListingDashboardClientProps) {
  const [input, setInput] = useState(initialListing);
  const [listing, setListing] = useState<ListingDashboardData | null>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input.trim();
    if (!value) {
      setError("Please paste an Etsy listing URL or ID to continue.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const data = await fetchListingDashboardAction(value);
        setListing(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch listing details.";
        setError(message);
      }
    });
  };

  const syncing = isPending;

  return (
    <div className="relative min-h-screen bg-slate-950/95 text-white">
      <LoadingOverlay show={syncing} label="Loading listing insights" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12">
        <section className="grid gap-6">
          <Card className="border-white/10 bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-sky-500/10 p-8 shadow-[0_40px_120px_rgba(56,189,248,0.25)] backdrop-blur-xl">
            <header className="flex flex-col gap-3">
              <Badge className="w-max border-none bg-emerald-500/20 px-3 py-1 text-xs uppercase tracking-[0.32em] text-emerald-200">
                Etsy Listing Command Deck
              </Badge>
              <h1 className="text-4xl font-semibold leading-tight text-white">
                Drop a listing URL to orchestrate live insights.
              </h1>
              <p className="max-w-2xl text-sm text-white/70">
                We will pull core listing details, inventory depth, and niche signals via the Magic UI data agents and shadcn styling layers.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="relative">
                <label htmlFor="listing-input" className="sr-only">
                  Etsy listing URL
                </label>
                <input
                  id="listing-input"
                  name="listing"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="https://www.etsy.com/listing/XXXXXXXXX"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 px-6 py-3 text-sm font-medium uppercase tracking-[0.22em] text-slate-950 shadow-[0_20px_60px_rgba(16,185,129,0.55)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-emerald-200/70"
                disabled={isPending}
              >
                {isPending ? "Syncing…" : "Fetch insights"}
              </button>
            </form>

            {error && (
              <p className="mt-4 text-sm text-rose-200/90">{error}</p>
            )}
          </Card>

          {listing ? (
            <ListingInsightsCard listing={listing} isLoading={isPending} />
          ) : (
            <EmptyStateCard />
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyStateCard() {
  return (
    <Card className="border-dashed border-white/15 bg-slate-900/70 p-12 text-center text-white/60">
      <p>Paste an Etsy listing URL above and we will populate the dashboard with live data.</p>
    </Card>
  );
}

function ListingInsightsCard({ listing, isLoading }: { listing: ListingDashboardData; isLoading: boolean }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="relative overflow-hidden border-white/10 bg-white/5 p-6 shadow-[0_28px_100px_rgba(56,189,248,0.22)]">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
        )}
        <header className="relative flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {listing.status && (
              <Badge className="border-none bg-emerald-500/20 text-emerald-100">{listing.status}</Badge>
            )}
            {listing.price && (
              <Badge className="border-none bg-white/10 text-white/80">{listing.price}</Badge>
            )}
          </div>
          <h2 className="text-2xl font-semibold text-white">{listing.title}</h2>
          {listing.shopName && (
            <a
              href={listing.shopUrl ?? "#"}
              target={listing.shopUrl ? "_blank" : undefined}
              rel={listing.shopUrl ? "noreferrer" : undefined}
              className="text-sm text-emerald-200/80 hover:text-emerald-200"
            >
              {listing.shopName}
            </a>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {listing.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent px-4 py-3"
              >
                <p className="text-xs uppercase tracking-[0.32em] text-white/50">{stat.label}</p>
                <p className="mt-2 text-xl font-semibold text-white">{stat.value}</p>
                {stat.description && <p className="text-xs text-white/40">{stat.description}</p>}
              </div>
            ))}
          </div>
        </header>

        {listing.description && (
          <section className="mt-6 space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">Story</h3>
            <p className="text-sm leading-relaxed text-white/70">{listing.description}</p>
          </section>
        )}

        {(listing.tags.length > 0 || listing.materials.length > 0) && (
          <section className="mt-6 grid gap-4 md:grid-cols-2">
            {listing.tags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-[0.32em] text-white/50">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.slice(0, 12).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {listing.materials.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-[0.32em] text-white/50">Materials</h4>
                <div className="flex flex-wrap gap-2">
                  {listing.materials.slice(0, 12).map((material) => (
                    <span
                      key={material}
                      className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70"
                    >
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </Card>

      <div className="grid gap-6">
        <Card className="border-white/10 bg-gradient-to-br from-emerald-500/10 via-white/5 to-transparent p-6 shadow-[0_24px_80px_rgba(56,189,248,0.18)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-white/50">Behavior score</p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-4xl font-semibold text-white">{listing.behaviorScore}</span>
                <Badge
                  className={
                    listing.behaviorLabel === "Hero"
                      ? "border-none bg-emerald-500/20 text-emerald-100"
                      : listing.behaviorLabel === "Steady"
                        ? "border-none bg-sky-500/20 text-sky-100"
                        : "border-none bg-amber-500/20 text-amber-100"
                  }
                >
                  {listing.behaviorLabel}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {listing.behaviorAlerts.length === 0 ? (
                <Badge className="border-none bg-emerald-500/15 text-emerald-100">All signals strong</Badge>
              ) : (
                listing.behaviorAlerts.map((alert) => (
                  <Badge key={alert} className="border-none bg-amber-500/20 text-amber-100">
                    {alert}
                  </Badge>
                ))
              )}
            </div>
          </div>
          {listing.behaviorMetrics.length > 0 && (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {listing.behaviorMetrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/50">{metric.label}</p>
                  <p className="mt-2 text-xl font-semibold text-white">{metric.value}</p>
                  {metric.description && <p className="text-xs text-white/50">{metric.description}</p>}
                </div>
              ))}
            </div>
          )}
          {listing.mobileReadiness && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/50">Mobile issues</p>
                <ul className="mt-2 space-y-1 text-xs text-rose-200/90">
                  {listing.mobileReadiness.issues.length ? (
                    listing.mobileReadiness.issues.map((issue) => <li key={issue}>• {issue}</li>)
                  ) : (
                    <li>• No blocking issues detected</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/50">Optimization hints</p>
                <ul className="mt-2 space-y-1 text-xs text-white/60">
                  {listing.mobileReadiness.hints.map((hint) => (
                    <li key={hint}>• {hint}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Card>

        {listing.shopMetrics.length > 0 && (
          <Card className="border-white/10 bg-slate-900/70 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">Shop metrics (30d)</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {listing.shopMetrics.slice(0, 4).map((metric) => {
                const numericValue =
                  metric.current ??
                  metric.previous ??
                  (metric.change !== undefined ? metric.change + (metric.previous ?? 0) : undefined);
                const formattedValue =
                  numericValue !== undefined
                    ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(numericValue)
                    : "—";
                return (
                  <div key={metric.key} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/50">{metric.label ?? metric.key}</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {formattedValue}
                      {metric.unit ? <span className="ml-1 text-sm text-white/50">{metric.unit}</span> : null}
                    </p>
                    {metric.change_rate !== undefined && (
                      <p className="text-xs text-white/50">
                        {metric.change_rate >= 0 ? "+" : ""}
                        {metric.change_rate.toFixed(1)}%
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {listing.sectionSummaries.length > 0 && (
          <Card className="border-white/10 bg-slate-900/70 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">Section footprint</h3>
            <div className="mt-4 space-y-3">
              {listing.sectionSummaries.map((section) => (
                <div key={section.sectionId} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{section.title}</p>
                    <p className="text-xs text-white/50">{section.activeCount} active · {section.listingsCount} total</p>
                  </div>
                  <Badge className="border-none bg-emerald-500/20 text-emerald-100">Section {section.sectionId}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {listing.reviewSummary && (
          <Card className="border-white/10 bg-slate-900/70 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">Review insights</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.28em] text-white/50">Total reviews</p>
                <p className="mt-2 text-xl font-semibold text-white">{listing.reviewSummary.totalReviews}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.28em] text-white/50">Average rating</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {listing.reviewSummary.averageRating !== undefined
                    ? listing.reviewSummary.averageRating.toFixed(2)
                    : "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.28em] text-white/50">Response rate</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {listing.reviewSummary.responseRate !== undefined
                    ? `${Math.round(listing.reviewSummary.responseRate * 100)}%`
                    : "—"}
                </p>
              </div>
            </div>
            {listing.reviewSummary.highlights.length > 0 && (
              <div className="mt-4 space-y-3">
                {listing.reviewSummary.highlights.map((highlight, index) => (
                  <div key={`${highlight.transaction_id}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-sm font-medium text-white">
                      {highlight.rating ? `${highlight.rating}★ · ` : ""}
                      {highlight.language ? highlight.language.toUpperCase() : "Review"}
                    </p>
                    <p className="text-xs text-white/60">{highlight.review_translated ?? highlight.review ?? "No review text"}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        <Card className="border-white/10 bg-slate-900/70 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">Variant pulse</h3>
          {listing.variants.length > 0 ? (
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>SKU</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listing.variants.map((variant) => (
                  <TableRow key={`${variant.option}-${variant.sku ?? "na"}`}>
                    <TableCell className="text-white/80">{variant.option}</TableCell>
                    <TableCell className="text-white/70">{variant.available}</TableCell>
                    <TableCell className="text-white/70">{variant.price ?? "—"}</TableCell>
                    <TableCell className="text-white/40">{variant.sku ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="mt-4 text-sm text-white/50">No variant data surfaced yet.</p>
          )}
        </Card>

        {listing.relatedListings.length > 0 && (
          <Card className="border-white/10 bg-slate-900/70 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">Related listings</h3>
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listing.relatedListings.map((related) => (
                  <TableRow key={related.listingId}>
                    <TableCell>
                      <a
                        href={related.url ?? "#"}
                        target={related.url ? "_blank" : undefined}
                        rel={related.url ? "noreferrer" : undefined}
                        className="text-sm font-medium text-white hover:text-emerald-200"
                      >
                        {related.title}
                      </a>
                    </TableCell>
                    <TableCell>{related.price ?? "—"}</TableCell>
                    <TableCell>
                      <Badge className={
                        related.state === "active"
                          ? "border-none bg-emerald-500/20 text-emerald-100"
                          : "border-none bg-amber-500/20 text-amber-100"
                      }>
                        {related.state ?? "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {listing.images.length > 0 && (
          <Card className="border-white/10 bg-slate-900/70 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">Gallery</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {listing.images.slice(0, 6).map((image) => (
                <div
                  key={image}
                  className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950/60"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="Listing" className="h-32 w-full object-cover" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {listing.url && (
          <Card className="border-white/10 bg-slate-900/70 p-6">
            <a
              href={listing.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-200/90 hover:text-emerald-200"
            >
              View on Etsy ↗
            </a>
          </Card>
        )}
      </div>
    </div>
  );
}
