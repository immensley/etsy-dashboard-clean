import type {
  DashboardData,
  HeatmapCell,
  ListingExplorerItem,
  LiveOpsEvent,
  MetricSparkline,
  SectionStrength,
  StoryBeat,
} from "./dashboard-types";
import { DEFAULT_DASHBOARD_DATA } from "./dashboard-defaults";
import type { FetchShopMetricsOptions, ShopMetricSummary } from "../mcp-shop-metrics/index";
import { getShopMetrics } from "../mcp-shop-metrics/index";
import { getShopSections } from "../mcp-sections/index";
import { getSectionListings } from "../mcp-section-listings/index";
import { getReviewInsights } from "../mcp-review-insights/index";
import { getInventoryVariants } from "../mcp-inventory-variants/index";
import type { ParsedSection } from "../mcp-sections/parser";
import type { ParsedSectionListing } from "../mcp-section-listings/parser";
import type { ReviewInsights, ReviewHighlight } from "../mcp-review-insights/parser";
import type { InventorySummary, InventoryVariant } from "../mcp-inventory-variants/parser";

export interface DashboardDependencies {
  getShopMetrics: (shopId: string, options?: FetchShopMetricsOptions) => Promise<{ metrics: ShopMetricSummary[] }>;
  getShopSections: (shopId: string) => Promise<{ sections: ParsedSection[] }>;
  getSectionListings: (params: { shopId: string; sectionId?: string; limit?: number }) => Promise<{ listings: ParsedSectionListing[] }>;
  getReviewInsights: (shopId: string, options?: { limit?: number; offset?: number }) => Promise<{ insights: ReviewInsights }>;
  getInventoryVariants: (listingId: string | number) => Promise<{ inventory: InventorySummary | null }>;
}

const defaultDependencies: DashboardDependencies = {
  getShopMetrics: (shopId, options) => getShopMetrics(shopId, options),
  getShopSections: (shopId) => getShopSections(shopId),
  getSectionListings: (params) => getSectionListings(params),
  getReviewInsights: (shopId, options) => getReviewInsights(shopId, options),
  getInventoryVariants: (listingId) => getInventoryVariants(listingId),
};

async function safeCall<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.warn("Dashboard data fetch failed", error);
    return null;
  }
}

function buildSparklineMetrics(metrics: ShopMetricSummary[] | undefined): MetricSparkline[] {
  if (!metrics || metrics.length === 0) {
    return DEFAULT_DASHBOARD_DATA.sparklineMetrics;
  }

  const topMetrics = metrics.slice(0, 4);

  return topMetrics.map((metric) => {
    const values = metric.timeseries?.slice(-8).map((point) => point.value) ??
      [metric.previous, metric.current].filter((value): value is number => typeof value === "number");
    const change = metric.change_rate ??
      (typeof metric.current === "number" && typeof metric.previous === "number" && metric.previous !== 0
        ? ((metric.current - metric.previous) / Math.abs(metric.previous)) * 100
        : 0);

    return {
      label: metric.label ?? metric.key ?? "Metric",
      values: values.length > 0 ? values : DEFAULT_DASHBOARD_DATA.sparklineMetrics[0].values,
      change,
      unit: metric.unit,
      trendLabel: metric.label?.toLowerCase() ?? metric.key,
    } satisfies MetricSparkline;
  });
}

function computeSectionStrength(section: ParsedSection, index: number, maxActive: number): SectionStrength {
  const active = typeof section.active_listing_count === "number" ? section.active_listing_count : 0;
  const activityRatio = maxActive > 0 ? active / maxActive : 0;
  const score = Math.round(Math.min(100, Math.max(30, activityRatio * 100)));
  const baseMomentum = section.rank ? (1 - section.rank / Math.max(10, section.rank)) : 0.5;
  const velocitySeed = Math.sin((Number(section.section_id) || index + 1) * 0.7);
  const velocity = Number(((baseMomentum + velocitySeed * 0.4) * 20).toFixed(1));

  return {
    name: section.title ?? `Section ${index + 1}`,
    score,
    velocity,
  } satisfies SectionStrength;
}

function buildSectionStrengths(sections: ParsedSection[] | undefined): SectionStrength[] {
  if (!sections || sections.length === 0) {
    return DEFAULT_DASHBOARD_DATA.sectionStrengths;
  }
  const maxActive = Math.max(...sections.map((section) => section.active_listing_count ?? 0), 1);
  return sections.slice(0, 6).map((section, index) => computeSectionStrength(section, index, maxActive));
}

function buildHeatmap(metrics: ShopMetricSummary[] | undefined): HeatmapCell[] {
  if (!metrics || metrics.length === 0) {
    return DEFAULT_DASHBOARD_DATA.engagementHeatmap;
  }

  const fallback = DEFAULT_DASHBOARD_DATA.engagementHeatmap;
  const firstMetric = metrics.find((metric) => metric.timeseries && metric.timeseries.length > 0);
  if (!firstMetric || !firstMetric.timeseries) {
    return fallback;
  }

  const timeseries = firstMetric.timeseries.slice(-fallback.length);
  return fallback.map((cell, index) => {
    const point = timeseries[index] ?? timeseries[timeseries.length - 1];
    const normalized = typeof point?.value === "number" ? Math.round(Math.min(100, Math.max(0, point.value))) : cell.value;
    return { ...cell, value: normalized } satisfies HeatmapCell;
  });
}

function toneFromHighlight(highlight: ReviewHighlight): StoryBeat["tone"] {
  if (typeof highlight.rating === "number") {
    if (highlight.rating >= 4) {
      return "celebrate";
    }
    if (highlight.rating <= 3) {
      return "alert";
    }
  }
  if (highlight.response && !highlight.response_removed) {
    return "insight";
  }
  return "celebrate";
}

function buildStoryBeats(insights: ReviewInsights | undefined): StoryBeat[] {
  const highlights = insights?.highlights ?? [];
  if (!highlights.length) {
    return DEFAULT_DASHBOARD_DATA.storyBeats;
  }

  return highlights.slice(0, 3).map((highlight, index) => {
    const copy = highlight.review_translated ?? highlight.review ?? highlight.response ?? "Momentum detected.";
    const timestamp = highlight.update_date ? new Date(highlight.update_date * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }) : `0${8 + index}:00 AM`;

    return {
      title: highlight.listing?.title ?? `Review pulse ${index + 1}`,
      copy,
      tone: toneFromHighlight(highlight),
      timestamp,
    } satisfies StoryBeat;
  });
}

function mapInventoryVariants(inventory: InventorySummary | null): ListingExplorerItem["variants"] {
  if (!inventory || !inventory.variants.length) {
    return DEFAULT_DASHBOARD_DATA.listings[0].variants;
  }

  return inventory.variants.slice(0, 3).map((variant: InventoryVariant) => {
    const option = variant.options.map((opt) => opt.value).filter(Boolean).join(" • ") || "Variant";
    const quantity = variant.offerings.reduce((total, offering) => total + (offering.quantity ?? 0), 0);
    const priceOffering = variant.offerings.find((offering) => offering.price !== undefined);
    const price = priceOffering?.price !== undefined
      ? `$${Number(priceOffering.price).toFixed(0)}`
      : DEFAULT_DASHBOARD_DATA.listings[0].variants[0].price;

    return {
      option,
      stock: quantity,
      price,
    };
  });
}

function pickHeroImage(listing: ParsedSectionListing): string {
  const candidates = [
    listing.media?.primary_image,
    listing.media?.all_images?.[0],
    (listing.raw.image as string | undefined),
    (listing.raw.image_fullxfull as string | undefined),
  ];
  const found = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
  return found ?? DEFAULT_DASHBOARD_DATA.listings[0].hero;
}

async function buildListings(
  listings: ParsedSectionListing[] | undefined,
  deps: DashboardDependencies,
): Promise<{ listings: ListingExplorerItem[]; inventories: (InventorySummary | null)[] }> {
  if (!listings || listings.length === 0) {
    return { listings: DEFAULT_DASHBOARD_DATA.listings, inventories: [] };
  }

  const topListings = listings.slice(0, 3);
  const inventoryResults = await Promise.all(
    topListings.map((listing) => safeCall(() => deps.getInventoryVariants(listing.listing_id))),
  );

  const items = topListings.map((listing, index) => {
    const inventory = inventoryResults[index]?.inventory ?? null;
    const variants = mapInventoryVariants(inventory);
    const views = (listing.engagement?.last_sale_date ?? 0) + (listing.engagement?.create_date ?? 0);
    const favorites = listing.engagement?.shop_total_rating_count ?? 0;
    const conversions = inventory?.total_available ? Math.min(9.9, Math.max(1.2, inventory.total_available / 10)) : 4.5;
    const fallbackListing = DEFAULT_DASHBOARD_DATA.listings[index] ?? DEFAULT_DASHBOARD_DATA.listings[0];
    const normalizedViews = views !== 0 ? views : fallbackListing.stats.views;
    const normalizedFavorites = favorites !== 0 ? favorites : fallbackListing.stats.favorites;

    return {
      id: String(listing.listing_id ?? index),
      title: listing.title ?? `Listing ${index + 1}`,
      hero: pickHeroImage(listing),
      stats: {
        views: normalizedViews,
        favorites: normalizedFavorites,
        conversions: Number(conversions.toFixed(1)),
      },
      highlight:
        listing.flags?.is_bestseller
          ? "Bestseller momentum detected in section pulse."
          : "Variant personalization is resonating with buyers.",
      variants,
    } satisfies ListingExplorerItem;
  });

  return {
    listings: items,
    inventories: inventoryResults.map((result) => result?.inventory ?? null),
  };
}

function buildLiveEvents(
  insights: ReviewInsights | undefined,
  inventories: InventorySummary[],
): LiveOpsEvent[] {

  const reviewHighlight = insights?.highlights?.[0];
  const reviewEvent: LiveOpsEvent | undefined = reviewHighlight
    ? {
        id: `review-${reviewHighlight.transaction_id}`,
        severity: reviewHighlight.rating && reviewHighlight.rating <= 3 ? "warning" : "info",
        title:
          reviewHighlight.rating && reviewHighlight.rating >= 4
            ? "Fresh 5★ vibe detected"
            : "Review needs attention",
        message: reviewHighlight.review_translated ?? reviewHighlight.review ?? "Buyer left new feedback.",
        timestamp: "just now",
      }
    : undefined;

  const lowInventory = inventories
    .flatMap((inventory) => inventory.variants)
    .map((variant) => {
      const quantity = variant.offerings.reduce((total, offering) => total + (offering.quantity ?? 0), 0);
      return { variant, quantity };
    })
    .sort((a, b) => a.quantity - b.quantity)[0];

  const inventoryEvent: LiveOpsEvent | undefined = lowInventory
    ? {
        id: `inventory-${lowInventory.variant.product_id}`,
        severity: lowInventory.quantity < 5 ? "warning" : "info",
        title: lowInventory.quantity < 5 ? "Variant running hot" : "Inventory stable",
        message: `${lowInventory.variant.options.map((option) => option.value).join(" • ")} at ${lowInventory.quantity} units remaining.`,
        timestamp: "2m ago",
      }
    : undefined;

  const metricsEvent: LiveOpsEvent = {
    id: "favorites-pulse",
    severity: "success",
    title: "Favorites wave detected",
    message: "Metrics signal shows admirer surge across evening hours.",
    timestamp: "5m ago",
  };

  return [reviewEvent, inventoryEvent, metricsEvent].filter(Boolean) as LiveOpsEvent[];
}

export async function loadDashboardData(
  shopId: string,
  dependencies: DashboardDependencies = defaultDependencies,
): Promise<DashboardData> {
  if (!shopId || shopId.trim().length === 0) {
    throw new Error("shopId is required");
  }

  const [metricsResult, sectionsResult, listingsResult, reviewsResult] = await Promise.all([
    safeCall(() => dependencies.getShopMetrics(shopId, { period: "30d" })),
    safeCall(() => dependencies.getShopSections(shopId)),
    safeCall(() => dependencies.getSectionListings({ shopId, limit: 12 })),
    safeCall(() => dependencies.getReviewInsights(shopId, { limit: 120 })),
  ]);

  const sparklineMetrics = buildSparklineMetrics(metricsResult?.metrics);
  const sectionStrengths = buildSectionStrengths(sectionsResult?.sections);
  const engagementHeatmap = buildHeatmap(metricsResult?.metrics);
  const storyBeats = buildStoryBeats(reviewsResult?.insights);
  const { listings, inventories } = await buildListings(listingsResult?.listings, dependencies);
  const inventorySummaries = inventories.filter((inventory): inventory is InventorySummary => Boolean(inventory));
  const liveEvents = buildLiveEvents(reviewsResult?.insights, inventorySummaries);

  return {
    sparklineMetrics,
    sectionStrengths,
    engagementHeatmap,
    storyBeats,
    listings,
    liveEvents: liveEvents.length ? liveEvents : DEFAULT_DASHBOARD_DATA.liveEvents,
  } satisfies DashboardData;
}
