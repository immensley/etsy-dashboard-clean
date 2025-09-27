import { unstable_cache } from "next/cache";
import { getListingData } from "@/mcp/index";
import { getInventoryVariants } from "@/mcp-inventory-variants/index";
import { getShopMetrics, type ShopMetricSummary } from "@/mcp-shop-metrics/index";
import { getShopSections } from "@/mcp-sections/index";
import { getReviewInsights } from "@/mcp-review-insights/index";
import { getSectionListings } from "@/mcp-section-listings/index";
import type { ListingDetails } from "@/mcp/parser.js";
import type { InventorySummary, InventoryVariant } from "@/mcp-inventory-variants/parser.js";
import type { ReviewInsights } from "@/mcp-review-insights/parser.js";
import type { ParsedSection } from "@/mcp-sections/parser.js";
import type { ParsedSectionListing } from "@/mcp-section-listings/parser.js";
import type {
  ListingDashboardData,
  ListingVariantRow,
  ListingStat,
  SectionSummaryEntry,
  ReviewSummary,
  RelatedListingSummary,
  BehaviorMetric,
} from "./listing-dashboard-types";
import { writePersistentCache, readPersistentCache } from "@/lib/storage/persistent-cache";
import { withRetry } from "@/lib/util/with-retry";

export function resolveListingId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Please provide an Etsy listing URL or ID");
  }

  const urlMatch = trimmed.match(/listing\/(\d{6,})/i);
  if (urlMatch) {
    return urlMatch[1];
  }

  const digitsMatch = trimmed.match(/(\d{6,})/);
  if (digitsMatch) {
    return digitsMatch[1];
  }

  throw new Error("Unable to extract a listing ID. Use a full Etsy URL or numeric listing ID.");
}

function formatPrice(value: ListingDetails["price"], currency?: string): string | undefined {
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency ?? "USD",
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    if (currency) {
      return `${value} ${currency}`;
    }
    return value;
  }

  return undefined;
}

function buildStats(listing: ListingDetails): ListingStat[] {
  const stats: ListingStat[] = [];
  const pushStat = (label: string, rawValue: unknown, description?: string) => {
    if (rawValue === undefined || rawValue === null) {
      return;
    }

    const numeric = typeof rawValue === "number" ? rawValue : Number(rawValue);
    const formatted = Number.isFinite(numeric)
      ? new Intl.NumberFormat("en-US", { notation: "compact" }).format(numeric)
      : String(rawValue);

    stats.push({ label, value: formatted, description });
  };

  pushStat("Favourites", listing.favorites, "People who saved this listing");
  pushStat("Carts", listing.in_carts, "Customers currently holding it in cart");
  pushStat("Views", listing.views, "Total global views");

  if (listing.price_details?.money_price && typeof listing.price_details.money_price === "object") {
    const gross = (listing.price_details.money_price as { amount?: number }).amount;
    pushStat("Base Price", gross, "Primary listing price amount");
  }

  return stats;
}

function buildVariants(inventory: InventorySummary | null, currency?: string): ListingVariantRow[] {
  if (!inventory || inventory.variants.length === 0) {
    return [];
  }

  return inventory.variants.map((variant: InventoryVariant) => {
    const option = variant.options.map((opt) => opt.value).filter(Boolean).join(" • ") || "Variant";
    const available = variant.offerings.reduce((total, offering) => total + (offering.quantity ?? 0), 0);
    const priceOffering = variant.offerings.find((offering) => offering.price !== undefined);
    const price = priceOffering?.price;

    return {
      option,
      sku: variant.sku,
      available,
      price: price !== undefined ? formatPrice(price, priceOffering?.currency ?? currency) : undefined,
      currency: priceOffering?.currency ?? currency,
    } satisfies ListingVariantRow;
  });
}

function resolveSectionId(listing: ListingDetails): string | undefined {
  const candidates = [
    (listing as unknown as { shop_section_id?: string | number })?.shop_section_id,
    (listing.raw_list as unknown as { shop_section_id?: string | number } | undefined)?.shop_section_id,
    (listing.raw_detail as unknown as { shop_section_id?: string | number } | undefined)?.shop_section_id,
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && String(candidate).length > 0) {
      return String(candidate);
    }
  }

  return undefined;
}

function summarizeSections(sections: ParsedSection[], limit = 5): SectionSummaryEntry[] {
  return sections.slice(0, limit).map((section) => ({
    sectionId: String(section.section_id ?? ""),
    title: section.title ?? `Section ${section.section_id}`,
    activeCount: section.active_listing_count ?? 0,
    listingsCount: section.listings_count ?? section.active_listing_count ?? 0,
  }));
}

function buildReviewSummary(insights: ReviewInsights | undefined, fallback?: ReviewSummary): ReviewSummary | undefined {
  if (!insights) {
    return fallback;
  }

  return {
    totalReviews: insights.total_reviews,
    averageRating: insights.average_rating ?? fallback?.averageRating,
    responseRate: insights.response_rate ?? fallback?.responseRate,
    highlights: insights.highlights.slice(0, 3),
    ratingBuckets: insights.rating_distribution.slice(0, 5),
  } satisfies ReviewSummary;
}

function buildRelatedListings(
  listings: ParsedSectionListing[] | undefined,
  currentListingId: string,
  limit = 6,
): RelatedListingSummary[] {
  if (!listings || listings.length === 0) {
    return [];
  }

  return listings
    .filter((listing) => String(listing.listing_id) !== currentListingId)
    .slice(0, limit)
    .map((listing) => ({
      listingId: String(listing.listing_id),
      title: listing.title ?? String(listing.listing_id),
      price:
        typeof listing.price === "number"
          ? new Intl.NumberFormat("en-US", { style: "currency", currency: listing.currency_code ?? "USD" }).format(
              listing.price,
            )
          : listing.pricing?.display ?? (typeof listing.price === "string" ? listing.price : undefined),
      state: listing.state,
      url: typeof listing.url === "string" ? listing.url : undefined,
    }));
}

function computeBehavior(
  listing: ListingDetails,
  reviewSummary?: ReviewSummary,
  fallback?: ListingDashboardData,
): {
  score: number;
  label: "Hero" | "Steady" | "At-risk";
  metrics: BehaviorMetric[];
  alerts: string[];
} {
  const toNumber = (value: unknown): number => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const favorites = toNumber(listing.favorites);
  const carts = toNumber(listing.in_carts);
  const views = toNumber(listing.views);
  const rating = reviewSummary?.averageRating ?? fallback?.reviewSummary?.averageRating ?? 0;
  const responseRate = reviewSummary?.responseRate ?? fallback?.reviewSummary?.responseRate ?? 0;

  const favoritesScore = Math.min(favorites / 20, 1);
  const cartsScore = Math.min(carts / 5, 1);
  const viewsScore = Math.min(views / 200, 1);
  const ratingScore = rating ? Math.min(rating / 5, 1) : 0.6;
  const responseScore = responseRate ? Math.min(responseRate, 1) : 0.5;

  const score = Math.round(
    favoritesScore * 25 + cartsScore * 30 + viewsScore * 10 + ratingScore * 25 + responseScore * 10,
  );

  let label: "Hero" | "Steady" | "At-risk";
  if (score >= 70) {
    label = "Hero";
  } else if (score >= 40) {
    label = "Steady";
  } else {
    label = "At-risk";
  }

  const metrics: BehaviorMetric[] = [
    { label: "Favorites", value: favorites.toString() },
    { label: "Carts", value: carts.toString() },
    { label: "Views", value: views.toString() },
    { label: "Avg rating", value: rating ? rating.toFixed(2) : "—" },
    { label: "Response", value: responseRate ? `${Math.round(responseRate * 100)}%` : "—" },
  ];

  const alerts: string[] = [];
  if (favorites < 5) alerts.push("Needs more favorites");
  if (carts < 2) alerts.push("Very few carts");
  if (rating && rating < 4) alerts.push("Rating below 4.0");
  if (responseRate && responseRate < 0.6) alerts.push("Low response rate");
  if (views < 50) alerts.push("Limited view volume");

  return { score, label, metrics, alerts };
}

function computeMobileReadiness(images: string[], description?: string): { issues: string[]; hints: string[] } {
  const issues: string[] = [];
  const hints: string[] = [];

  if (images.length < 4) {
    issues.push("Add more gallery images for mobile swipes");
  } else {
    hints.push("Gallery has plenty of photos for mobile browsing");
  }

  if (!description || description.length < 120) {
    issues.push("Description is short—expand details for shoppers");
  } else if (description.length > 1200) {
    hints.push("Consider breaking description into scannable sections");
  }

  return { issues, hints };
}

function ensureArrays(data: ListingDashboardData): ListingDashboardData {
  return {
    ...data,
    tags: data.tags ?? [],
    materials: data.materials ?? [],
    stats: data.stats ?? [],
    images: data.images ?? [],
    variants: data.variants ?? [],
    shopMetrics: data.shopMetrics ?? [],
    sectionSummaries: data.sectionSummaries ?? [],
    relatedListings: data.relatedListings ?? [],
    reviewSummary: data.reviewSummary
      ? {
          totalReviews: data.reviewSummary.totalReviews,
          averageRating: data.reviewSummary.averageRating,
          responseRate: data.reviewSummary.responseRate,
          highlights: data.reviewSummary.highlights ?? [],
          ratingBuckets: data.reviewSummary.ratingBuckets ?? [],
        }
      : undefined,
    behaviorMetrics: data.behaviorMetrics ?? [],
    behaviorAlerts: data.behaviorAlerts ?? [],
    mobileReadiness: data.mobileReadiness
      ? {
          issues: data.mobileReadiness.issues ?? [],
          hints: data.mobileReadiness.hints ?? [],
        }
      : undefined,
  } satisfies ListingDashboardData;
}

async function loadListingDashboardDataForId(listingId: string): Promise<ListingDashboardData> {
  const cacheKey = `listing-${listingId}`;
  let fallback: ListingDashboardData | null = null;

  try {
    fallback = await readPersistentCache<ListingDashboardData>(cacheKey);

    const listing = await withRetry(() => getListingData(listingId));
    if (!listing) {
      throw new Error("Listing not found");
    }

    let inventory: InventorySummary | null = null;
    try {
      const inventoryPayload = await withRetry(() => getInventoryVariants(listingId));
      inventory = inventoryPayload.inventory ?? null;
    } catch (error) {
      console.warn("Inventory fetch failed", error);
    }

    const shopId = String((listing as unknown as { shop_id?: string | number }).shop_id ?? fallback?.shopId ?? "");

    let shopMetrics: ShopMetricSummary[] = fallback?.shopMetrics ?? [];
    if (shopId) {
      try {
        const metricsPayload = await withRetry(() => getShopMetrics(shopId, { period: "30d" }));
        shopMetrics = metricsPayload.metrics ?? shopMetrics;
      } catch (error) {
        console.warn("Shop metrics fetch failed", error);
      }
    }

    let sectionsList: ParsedSection[] = [];
    let sectionSummaries: SectionSummaryEntry[] = fallback?.sectionSummaries ?? [];
    if (shopId) {
      try {
        const sectionsPayload = await withRetry(() => getShopSections(shopId));
        sectionsList = sectionsPayload.sections;
        sectionSummaries = summarizeSections(sectionsList);
      } catch (error) {
        console.warn("Shop sections fetch failed", error);
      }
    }

    let reviewSummary: ReviewSummary | undefined = fallback?.reviewSummary;
    if (shopId) {
      try {
        const reviewPayload = await withRetry(() => getReviewInsights(shopId, { limit: 60 }));
        reviewSummary = buildReviewSummary(reviewPayload.insights, fallback?.reviewSummary);
      } catch (error) {
        console.warn("Review insights fetch failed", error);
      }
    }

    const resolvedSectionId = resolveSectionId(listing) ?? fallback?.sectionId;
    let relatedListings: RelatedListingSummary[] = fallback?.relatedListings ?? [];
    if (shopId) {
      const targetSectionId = resolvedSectionId ?? (sectionsList[0]?.section_id ? String(sectionsList[0].section_id) : undefined);
      if (targetSectionId) {
        try {
          const sectionPayload = await withRetry(() =>
            getSectionListings({ shopId, sectionId: targetSectionId, limit: 60 }),
          );
          relatedListings = buildRelatedListings(sectionPayload.listings, listingId);
        } catch (error) {
          console.warn("Section listings fetch failed", error);
        }
      }
    }

    const priceDisplay = formatPrice(listing.price, listing.currency);
    const stats = buildStats(listing);
    const builtVariants = buildVariants(inventory, listing.currency);
    const variants = builtVariants.length ? builtVariants : fallback?.variants ?? [];
    const tags = listing.tags ?? fallback?.tags ?? [];
    const materials = listing.materials ?? fallback?.materials ?? [];
    const images = listing.images ?? fallback?.images ?? [];
    const behavior = computeBehavior(listing, reviewSummary, fallback ?? undefined);
    const mobileReadiness = computeMobileReadiness(images, listing.description ?? fallback?.description);

    const result: ListingDashboardData = {
      listingId,
      title: listing.title ?? fallback?.title ?? "Untitled listing",
      price: priceDisplay ?? fallback?.price,
      currency: listing.currency ?? fallback?.currency,
      status: listing.state ?? fallback?.status,
      shopId: shopId || fallback?.shopId,
      shopName: listing.shop_name ?? fallback?.shopName,
      shopUrl: listing.shop_url ?? fallback?.shopUrl,
      url: listing.url ?? fallback?.url,
      description: listing.description ?? fallback?.description,
      tags,
      materials,
      stats: stats.length ? stats : fallback?.stats ?? [],
      images,
      variants,
      shopMetrics,
      sectionSummaries,
      reviewSummary,
      relatedListings,
      sectionId: resolvedSectionId ?? fallback?.sectionId,
      behaviorScore: behavior.score,
      behaviorLabel: behavior.label,
      behaviorMetrics: behavior.metrics,
      behaviorAlerts: behavior.alerts,
      mobileReadiness,
    };

    const normalized = ensureArrays(result);
    await writePersistentCache(cacheKey, normalized);
    return normalized;
  } catch (error) {
    const cached = fallback ?? (await readPersistentCache<ListingDashboardData>(cacheKey));
    if (cached) {
      console.warn("Using cached listing data after failure", listingId, error);
      return ensureArrays(cached);
    }
    throw error;
  }
}

export async function loadListingDashboardData(input: string): Promise<ListingDashboardData> {
  const listingId = resolveListingId(input);
  return loadListingDashboardDataForId(listingId);
}

export async function getListingDashboardData(input: string): Promise<ListingDashboardData> {
  const listingId = resolveListingId(input);
  const cached = unstable_cache(
    () => loadListingDashboardDataForId(listingId),
    ["listing-dashboard", listingId],
    {
      revalidate: 600,
      tags: [`listing-dashboard-${listingId}`],
    },
  );

  return cached();
}
