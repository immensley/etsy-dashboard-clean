import { unstable_cache } from "next/cache";
import { getSectionListings } from "@/mcp-section-listings/index";
import type { ParsedSectionListing } from "@/mcp-section-listings/parser";
import { getShopSections } from "@/mcp-sections/index";
import type { ParsedSection } from "@/mcp-sections/parser";
import { withRetry } from "@/lib/util/with-retry";
import { readPersistentCache, writePersistentCache } from "@/lib/storage/persistent-cache";

export interface SectionSummary {
  sectionId: string;
  total: number;
  active: number;
  averagePrice: number | null;
  lowStock: number;
  sampleListing?: ParsedSectionListing;
}

export interface SectionDashboardData {
  generatedAt: string;
  sectionId: string;
  listings: ParsedSectionListing[];
  summary: SectionSummary;
}

export interface SectionMetadata {
  sectionId: string;
  title: string;
  activeCount: number;
}

function computeSummary(sectionId: string, listings: ParsedSectionListing[]): SectionSummary {
  const active = listings.filter((listing) => listing.state === "active").length;
  const prices = listings
    .map((listing) => {
      const value = listing.price;
      if (typeof value === "number") {
        return value;
      }
      if (typeof value === "string") {
        const numeric = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
        return Number.isFinite(numeric) ? numeric : null;
      }
      return null;
    })
    .filter((value): value is number => value !== null && Number.isFinite(value));

  const averagePrice = prices.length ? prices.reduce((sum, value) => sum + value, 0) / prices.length : null;
  const lowStock = listings.filter((listing) => {
    const quantity = typeof listing.quantity === "number" ? listing.quantity : Number(listing.quantity);
    return Number.isFinite(quantity) && quantity < 5;
  }).length;

  return {
    sectionId,
    total: listings.length,
    active,
    averagePrice,
    lowStock,
    sampleListing: listings[0],
  } satisfies SectionSummary;
}

async function loadSectionListingsInternal(shopId: string, sectionId?: string): Promise<SectionDashboardData> {
  const cacheKey = `section-${shopId}-${sectionId ?? "all"}`;
  let fallback: SectionDashboardData | null = null;

  try {
    fallback = await readPersistentCache<SectionDashboardData>(cacheKey);
    const payload = await withRetry(() => getSectionListings({ shopId, sectionId, limit: 1000 }), {
      attempts: 3,
      delayMs: 600,
    });
    const listings = payload.listings ?? fallback?.listings ?? [];
    const summary = computeSummary(sectionId ?? "all", listings);

    const result: SectionDashboardData = {
      generatedAt: new Date().toISOString(),
      sectionId: sectionId ?? "all",
      listings,
      summary,
    };

    await writePersistentCache(cacheKey, result);
    return result;
  } catch (error) {
    const cached = fallback ?? (await readPersistentCache<SectionDashboardData>(cacheKey));
    if (cached) {
      console.warn("Using cached section data after failure", sectionId ?? "all", error);
      return cached;
    }
    throw error;
  }
}

export async function loadSectionDashboardData(shopId: string, sectionId?: string): Promise<SectionDashboardData> {
  return loadSectionListingsInternal(shopId, sectionId);
}

export async function getSectionDashboardData(shopId: string, sectionId?: string): Promise<SectionDashboardData> {
  const cacheKey = ["section-dashboard", shopId, sectionId ?? "all"];
  const cached = unstable_cache(
    () => loadSectionListingsInternal(shopId, sectionId),
    cacheKey,
    {
      revalidate: 300,
      tags: [cacheKey.join(":")],
    },
  );

  return cached();
}

export async function getSectionMetadata(shopId: string): Promise<SectionMetadata[]> {
  const cached = unstable_cache(
    async () => {
      const result = await withRetry(() => getShopSections(shopId));
      return result.sections.map((section: ParsedSection) => ({
        sectionId: String(section.section_id ?? ""),
        title: section.title ?? `Section ${section.section_id}`,
        activeCount: section.active_listing_count ?? 0,
      }));
    },
    ["section-metadata", shopId],
    {
      revalidate: 600,
      tags: ["section-metadata", shopId],
    },
  );

  return cached();
}
