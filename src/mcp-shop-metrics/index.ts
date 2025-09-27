import { fetchShopMetrics, type FetchShopMetricsOptions } from "./etsyShopMetricsClient.js";
import { parseShopMetrics, type ShopMetricSummary } from "./parser.js";

export interface ShopMetricsPayload {
  metrics: ShopMetricSummary[];
  raw: unknown;
}

export async function getShopMetrics(shopId: string, options: FetchShopMetricsOptions = {}): Promise<ShopMetricsPayload> {
  if (!shopId || shopId.trim().length === 0) {
    throw new Error("Missing required parameter: shopId");
  }

  const raw = await fetchShopMetrics(shopId.trim(), options);
  const metrics = parseShopMetrics(raw);

  return { metrics, raw };
}

export async function fetchMetrics({
  shop_id,
  period,
  metrics,
}: {
  shop_id: string;
  period?: string;
  metrics?: string | string[];
}): Promise<ShopMetricsPayload> {
  const metricList = Array.isArray(metrics)
    ? metrics
    : typeof metrics === "string"
      ? metrics.split(/[,\s]+/).map((item) => item.trim()).filter((item) => item.length > 0)
      : undefined;
  return getShopMetrics(shop_id, { period, metrics: metricList });
}

export { type ShopMetricSummary } from "./parser.js";
export { type FetchShopMetricsOptions } from "./etsyShopMetricsClient.js";
