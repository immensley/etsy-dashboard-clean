import { fetchShopMetrics } from "./etsyShopMetricsClient.js";
import { parseShopMetrics } from "./parser.js";
export async function getShopMetrics(shopId, options = {}) {
    if (!shopId || shopId.trim().length === 0) {
        throw new Error("Missing required parameter: shopId");
    }
    const raw = await fetchShopMetrics(shopId.trim(), options);
    const metrics = parseShopMetrics(raw);
    return { metrics, raw };
}
export async function fetchMetrics({ shop_id, period, metrics, }) {
    const metricList = Array.isArray(metrics)
        ? metrics
        : typeof metrics === "string"
            ? metrics.split(/[,\s]+/).map((item) => item.trim()).filter((item) => item.length > 0)
            : undefined;
    return getShopMetrics(shop_id, { period, metrics: metricList });
}
