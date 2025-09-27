export interface MetricSparkline {
  label: string;
  values: number[];
  change: number;
  unit?: string;
  trendLabel?: string;
}

export interface SectionStrength {
  name: string;
  score: number;
  velocity: number;
}

export interface HeatmapCell {
  day: string;
  hour: number;
  value: number;
}

export type StoryTone = "celebrate" | "alert" | "insight";

export interface StoryBeat {
  title: string;
  copy: string;
  tone: StoryTone;
  timestamp: string;
}

export interface ListingVariantPreview {
  option: string;
  stock: number;
  price: string;
}

export interface ListingExplorerItem {
  id: string;
  title: string;
  hero: string;
  stats: {
    views: number;
    favorites: number;
    conversions: number;
  };
  highlight: string;
  variants: ListingVariantPreview[];
}

export type LiveOpsSeverity = "info" | "warning" | "success";

export interface LiveOpsEvent {
  id: string;
  severity: LiveOpsSeverity;
  title: string;
  message: string;
  timestamp: string;
}

export type AnalyticsTabKey = "overview" | "sections" | "momentum";

export interface DashboardData {
  sparklineMetrics: MetricSparkline[];
  sectionStrengths: SectionStrength[];
  engagementHeatmap: HeatmapCell[];
  storyBeats: StoryBeat[];
  listings: ListingExplorerItem[];
  liveEvents: LiveOpsEvent[];
}
