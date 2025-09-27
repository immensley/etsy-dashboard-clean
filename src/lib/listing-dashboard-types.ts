import type { ShopMetricSummary } from "@/mcp-shop-metrics/index";
import type { ReviewHighlight, RatingBucket } from "@/mcp-review-insights/parser";

export interface ListingVariantRow {
  option: string;
  sku?: string;
  available: number;
  price?: string;
  currency?: string;
}

export interface ListingStat {
  label: string;
  value: string;
  description?: string;
}

export interface BehaviorMetric {
  label: string;
  value: string;
  description?: string;
}

export interface SectionSummaryEntry {
  sectionId: string;
  title: string;
  activeCount: number;
  listingsCount: number;
}

export interface ReviewSummary {
  totalReviews: number;
  averageRating?: number;
  responseRate?: number;
  highlights: ReviewHighlight[];
  ratingBuckets: RatingBucket[];
}

export interface RelatedListingSummary {
  listingId: string;
  title: string;
  price?: string;
  state?: string;
  url?: string;
}

export interface ListingDashboardData {
  listingId: string;
  title: string;
  price?: string;
  currency?: string;
  status?: string;
  shopId?: string;
  shopName?: string;
  shopUrl?: string;
  url?: string;
  description?: string;
  tags: string[];
  materials: string[];
  stats: ListingStat[];
  images: string[];
  variants: ListingVariantRow[];
  shopMetrics: ShopMetricSummary[];
  sectionSummaries: SectionSummaryEntry[];
  reviewSummary?: ReviewSummary;
  relatedListings: RelatedListingSummary[];
  sectionId?: string;
  behaviorScore: number;
  behaviorLabel: "Hero" | "Steady" | "At-risk";
  behaviorMetrics: BehaviorMetric[];
  behaviorAlerts: string[];
  mobileReadiness?: {
    issues: string[];
    hints: string[];
  };
}
