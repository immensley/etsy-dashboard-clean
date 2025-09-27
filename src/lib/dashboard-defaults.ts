import type { DashboardData } from "./dashboard-types";

export const DEFAULT_SHOP_ID = "21299137"; // demo shop id used for seeded content

export const DEFAULT_DASHBOARD_DATA: DashboardData = {
  sparklineMetrics: [
    {
      label: "Revenue",
      values: [32, 36, 42, 41, 59, 65, 72, 94],
      change: 27.4,
      unit: "$",
      trendLabel: "7 day flow",
    },
    {
      label: "Conversion",
      values: [2.2, 2.5, 2.9, 3.4, 3.6, 3.9, 4.2, 4.9],
      change: 18.6,
      trendLabel: "buyer alchemy",
    },
    {
      label: "Favorites",
      values: [185, 192, 204, 233, 248, 266, 289, 315],
      change: 22.1,
      trendLabel: "admirer wave",
    },
    {
      label: "Review Velocity",
      values: [6, 8, 11, 19, 22, 24, 31, 36],
      change: 41.7,
      trendLabel: "sentiment",
    },
  ],
  sectionStrengths: [
    { name: "Personalized Gifts", score: 94, velocity: 34.2 },
    { name: "Ceremony Essentials", score: 88, velocity: 18.5 },
    { name: "VIP Bundles", score: 81, velocity: 12.1 },
    { name: "Trending Metals", score: 78, velocity: 21.9 },
    { name: "Day-Of Stationery", score: 86, velocity: 16.4 },
    { name: "Keepsake Boxes", score: 90, velocity: 27.6 },
  ],
  engagementHeatmap: [
    { day: "Mon", hour: 12, value: 54 },
    { day: "Mon", hour: 18, value: 82 },
    { day: "Tue", hour: 14, value: 66 },
    { day: "Wed", hour: 20, value: 91 },
    { day: "Thu", hour: 16, value: 74 },
    { day: "Fri", hour: 20, value: 96 },
    { day: "Sat", hour: 18, value: 88 },
    { day: "Sun", hour: 12, value: 63 },
    { day: "Sun", hour: 20, value: 78 },
  ],
  storyBeats: [
    {
      title: "Personalized blades just shattered the cart record",
      copy:
        "Engraved pocket knives surged 41% after a TikTok micro-viral clip. Recommend leaning into the VHS-style product video the MCP flagged – it is driving 2.3x conversions from mobile.",
      tone: "celebrate",
      timestamp: "08:42 AM",
    },
    {
      title: "Two sections approaching inventory cliffs",
      copy:
        "Ceremony Essentials variants ‘champagne / 12 set’ and ‘sage / 8 set’ both dipped below the smart-threshold. Trigger the one-click resupply flow before the 6PM traffic wave.",
      tone: "alert",
      timestamp: "09:10 AM",
    },
    {
      title: "New admirer wave is skewing West Coast",
      copy:
        "Admirers are layering favorites between 6-10PM PST with a 32% add-to-cart jump. Consider geo-tuned announcement copy to convert the hidden intent spike.",
      tone: "insight",
      timestamp: "10:04 AM",
    },
  ],
  listings: [
    {
      id: "knife",
      title: "Engraved Midnight Steel Knife",
      hero: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=90",
      stats: { views: 4821, favorites: 942, conversions: 5.8 },
      highlight: "Hero variant is pulling 3.4x CTR after story mode push.",
      variants: [
        { option: "Black • Walnut", stock: 18, price: "$32" },
        { option: "Steel • Maple", stock: 7, price: "$34" },
        { option: "Rose • Ebony", stock: 3, price: "$36" },
      ],
    },
    {
      id: "box",
      title: "Keepsake Proposal Box",
      hero: "https://images.unsplash.com/photo-1522040806052-9186e3b99934?auto=format&fit=crop&w=1200&q=90",
      stats: { views: 3920, favorites: 1234, conversions: 4.6 },
      highlight: "Premium lining upsell is pairing with reviewer shout-outs.",
      variants: [
        { option: "Velvet Navy", stock: 10, price: "$54" },
        { option: "Ivory Silk", stock: 5, price: "$62" },
        { option: "Champagne Linen", stock: 9, price: "$58" },
      ],
    },
    {
      id: "badge",
      title: "Art Deco Name Badge Set",
      hero: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=90",
      stats: { views: 5214, favorites: 1611, conversions: 6.2 },
      highlight: "Buyers are remixing fonts in customizer – drop-in template saved 8m per order.",
      variants: [
        { option: "Emerald", stock: 14, price: "$42" },
        { option: "Mocha", stock: 8, price: "$40" },
        { option: "Ivory", stock: 4, price: "$41" },
      ],
    },
  ],
  liveEvents: [
    {
      id: "review",
      severity: "info",
      title: "New 5★ review landed",
      message:
        "“These groomsmen boxes were the talk of the night” — highlighted variant: Keepsake Box • Ivory Silk",
      timestamp: "3m ago",
    },
    {
      id: "inventory",
      severity: "warning",
      title: "Variant down to 3 units",
      message: "Engraved Midnight Steel Knife • Rose Ebony is breaching smart-threshold. Auto pinged supplier.",
      timestamp: "7m ago",
    },
    {
      id: "traffic",
      severity: "success",
      title: "Favorites wave detected",
      message: "West coast buyers stacking favorites on Art Deco Badge Set. 2.1x add-to-cart probability spike.",
      timestamp: "11m ago",
    },
  ],
};
