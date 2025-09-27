import test from "node:test";
import assert from "node:assert/strict";
import type { DashboardDependencies } from "./dashboard-service";
import { loadDashboardData } from "./dashboard-service";
import { DEFAULT_DASHBOARD_DATA } from "./dashboard-defaults";
import type { ShopMetricSummary } from "@/mcp-shop-metrics/index";
import type { ParsedSection } from "@/mcp-sections/parser";
import type { ParsedSectionListing } from "@/mcp-section-listings/parser";
import type { ReviewInsights } from "@/mcp-review-insights/parser";
import type { InventorySummary } from "@/mcp-inventory-variants/parser";

test("loadDashboardData stitches metrics, listings and insights", async () => {
  const metrics: ShopMetricSummary[] = [
    {
      key: "revenue",
      label: "Revenue",
      unit: "$",
      current: 9200,
      previous: 7100,
      change_rate: 28,
      timeseries: [
        { date: "2024-01-01", value: 60 },
        { date: "2024-01-02", value: 70 },
        { date: "2024-01-03", value: 75 },
        { date: "2024-01-04", value: 90 },
      ],
      raw: {},
    },
  ];

  const sections: ParsedSection[] = [
    {
      section_id: "alpha",
      title: "Custom Gifts",
      active_listing_count: 42,
      listings_count: 60,
      raw: {},
    },
  ];

  const listings: ParsedSectionListing[] = [
    {
      listing_id: "123",
      title: "Galaxy Knife",
      media: { primary_image: "https://cdn.example.com/knife.jpg" },
      engagement: { last_sale_date: 12, create_date: 24, shop_total_rating_count: 64 },
      flags: { is_bestseller: true },
      raw: {},
    },
  ];

  const insights: ReviewInsights = {
    total_reviews: 2,
    rating_distribution: [],
    language_counts: [],
    highlights: [
      {
        transaction_id: "txn-1",
        listing: { title: "Galaxy Knife" },
        rating: 5,
        review: "Incredible craftsmanship",
      },
    ],
  };

  const inventory: InventorySummary = {
    listing_id: "123",
    variants: [
      {
        product_id: "variant-1",
        options: [{ value: "Walnut" }],
        offerings: [{ price: 42, quantity: 3 }],
        raw: {} as never,
      },
    ],
    raw: {} as never,
  };

  const deps: DashboardDependencies = {
    getShopMetrics: async () => ({ metrics }),
    getShopSections: async () => ({ sections }),
    getSectionListings: async () => ({ listings }),
    getReviewInsights: async () => ({ insights }),
    getInventoryVariants: async () => ({ inventory }),
  };

  const result = await loadDashboardData("demo-shop", deps);

  assert.equal(result.sparklineMetrics[0].label, "Revenue");
  assert.ok(result.sectionStrengths.some((section) => section.name === "Custom Gifts"));
  assert.equal(result.listings[0].title, "Galaxy Knife");
  assert.equal(result.listings[0].variants[0].stock, 3);
  assert.ok(result.storyBeats.length > 0);
  assert.ok(result.liveEvents.length > 0);
});

test("loadDashboardData falls back to defaults on failure", async () => {
  const deps: DashboardDependencies = {
    getShopMetrics: async () => {
      throw new Error("metrics offline");
    },
    getShopSections: async () => {
      throw new Error("sections offline");
    },
    getSectionListings: async () => {
      throw new Error("listings offline");
    },
    getReviewInsights: async () => {
      throw new Error("reviews offline");
    },
    getInventoryVariants: async () => ({ inventory: null }),
  };

  const result = await loadDashboardData("demo-shop", deps);

  assert.deepEqual(result.sparklineMetrics, DEFAULT_DASHBOARD_DATA.sparklineMetrics);
  assert.deepEqual(result.sectionStrengths, DEFAULT_DASHBOARD_DATA.sectionStrengths);
  assert.deepEqual(result.listings, DEFAULT_DASHBOARD_DATA.listings);
  assert.ok(result.liveEvents.length >= 1);
});
