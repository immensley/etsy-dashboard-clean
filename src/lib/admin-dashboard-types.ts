import type { ListingDashboardData } from "@/lib/listing-dashboard-types";

export interface AdminListingInsight {
  label: string;
  listingId: string;
  input: string;
  status: "active" | "inactive" | "error";
  lastSync: string;
  data?: ListingDashboardData;
  priceDisplay?: string;
  priceValue?: number;
  variantsTotal: number;
  lowStockCount: number;
  availabilityRatio: number;
  error?: string;
  behaviorScore: number;
  behaviorLabel: "Hero" | "Steady" | "At-risk";
  behaviorAlerts: string[];
}

export interface AdminSummaryMetric {
  label: string;
  value: string;
  description?: string;
  accent?: "emerald" | "sky" | "rose" | "amber";
}

export interface AdminAlert {
  type: "warning" | "info" | "success";
  headline: string;
  detail: string;
}

export interface AdminDashboardData {
  generatedAt: string;
  listings: AdminListingInsight[];
  summary: AdminSummaryMetric[];
  alerts: AdminAlert[];
  lowStockListings: AdminListingInsight[];
}
