import { MONITORED_LISTINGS } from "@/lib/admin-config";
import { getListingDashboardData, resolveListingId } from "@/lib/listing-dashboard-service";
import type { AdminDashboardData, AdminListingInsight, AdminSummaryMetric, AdminAlert } from "@/lib/admin-dashboard-types";
import { unstable_cache } from "next/cache";
import { writePersistentCache, readPersistentCache } from "@/lib/storage/persistent-cache";

function summarizeListings(listings: AdminListingInsight[]): AdminSummaryMetric[] {
  const total = listings.length;
  const active = listings.filter((listing) => listing.status === "active").length;
  const lowStock = listings.reduce((sum, listing) => sum + listing.lowStockCount, 0);
  const variantTotal = listings.reduce((sum, listing) => sum + listing.variantsTotal, 0);
  const reliability = total > 0 ? Math.round((active / total) * 100) : 0;
  const averageBehavior = total > 0 ? Math.round(listings.reduce((sum, item) => sum + item.behaviorScore, 0) / total) : 0;

  return [
    {
      label: "Listings monitored",
      value: String(total),
      description: "URLs under management",
      accent: "emerald",
    },
    {
      label: "Reliability",
      value: `${reliability}%`,
      description: `${active}/${total} active`,
      accent: "sky",
    },
    {
      label: "Behavior index",
      value: `${averageBehavior}`,
      description: "Average engagement score",
      accent: "amber",
    },
    {
      label: "Variants tracked",
      value: String(variantTotal),
      description: `${lowStock} flagged low`,
      accent: "rose",
    },
  ];
}

function buildAlerts(listings: AdminListingInsight[]): AdminAlert[] {
  const alerts: AdminAlert[] = [];

  listings.forEach((listing) => {
    if (listing.status === "error") {
      alerts.push({
        type: "warning",
        headline: `${listing.label} fetch failed`,
        detail: listing.error ?? "The MCP call returned an error.",
      });
      return;
    }

    if (listing.status === "inactive") {
      alerts.push({
        type: "warning",
        headline: `${listing.label} is no longer active`,
        detail: "Listing state is not marked as active. Investigate on Etsy to confirm availability.",
      });
    }

    if (listing.lowStockCount > 0) {
      alerts.push({
        type: "info",
        headline: `${listing.label} low stock`,
        detail: `${listing.lowStockCount} variant${listing.lowStockCount === 1 ? "" : "s"} are under threshold.`,
      });
    }
  });

  if (alerts.length === 0) {
    alerts.push({
      type: "success",
      headline: "All systems stable",
      detail: "All monitored listings are active and within stock thresholds.",
    });
  }

  return alerts;
}

async function loadAdminDashboardDataInternal(): Promise<AdminDashboardData> {
  const generatedAt = new Date().toISOString();

  const insights = await Promise.all(
    MONITORED_LISTINGS.map(async ({ label, input, threshold = 5 }) => {
      const listingId = resolveListingId(input);
      try {
        const data = await getListingDashboardData(listingId);
        const status = data.status?.toLowerCase() === "active" ? "active" : "inactive";
        const lowStockCount = data.variants.filter((variant) => variant.available < threshold).length;
        const priceValue = typeof data.price === "string"
          ? Number.parseFloat(data.price.replace(/[^0-9.]/g, ""))
          : undefined;
        const availabilityRatio = data.variants.length
          ? (data.variants.length - lowStockCount) / data.variants.length
          : 1;

        const behaviorScore = data.behaviorScore ?? 0;
        return {
          label,
          listingId,
          input,
          lastSync: generatedAt,
          status,
          data,
          priceDisplay: data.price,
          priceValue: Number.isFinite(priceValue) ? priceValue : undefined,
          variantsTotal: data.variants.length,
          lowStockCount,
          availabilityRatio,
          behaviorScore,
          behaviorLabel: data.behaviorLabel,
          behaviorAlerts: data.behaviorAlerts,
        } satisfies AdminListingInsight;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown MCP failure";
        return {
          label,
          listingId,
          input,
          lastSync: generatedAt,
          status: "error",
          error: message,
          variantsTotal: 0,
          lowStockCount: 0,
          availabilityRatio: 0,
          behaviorScore: 0,
          behaviorLabel: "At-risk",
          behaviorAlerts: ["MCP fetch failed"],
        } satisfies AdminListingInsight;
      }
    }),
  );

  return {
    generatedAt,
    listings: insights,
    summary: summarizeListings(insights),
    alerts: buildAlerts(insights),
    lowStockListings: insights
      .filter((listing) => listing.lowStockCount > 0)
      .sort((a, b) => b.lowStockCount - a.lowStockCount)
      .slice(0, 5),
  } satisfies AdminDashboardData;
}

export async function loadAdminDashboardData(): Promise<AdminDashboardData> {
  const cacheKey = "admin-dashboard";
  try {
    const data = await loadAdminDashboardDataInternal();
    await writePersistentCache(cacheKey, data);
    return data;
  } catch (error) {
    const fallback = await readPersistentCache<AdminDashboardData>(cacheKey);
    if (fallback) {
      console.warn("Using cached admin dashboard after failure", error);
      return fallback;
    }
    throw error;
  }
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const cached = unstable_cache(loadAdminDashboardData, ["admin-dashboard"], {
    revalidate: 300,
    tags: ["admin-dashboard"],
  });

  return cached();
}
