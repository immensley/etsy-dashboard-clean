import fetch from "node-fetch";

export interface FetchShopMetricsOptions {
  period?: string;
  metrics?: string[];
}

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36";

function buildMetricsUrl(shopId: string, options: FetchShopMetricsOptions): string {
  const period = options.period && options.period.trim().length > 0 ? options.period.trim() : "30d";
  const metrics = Array.isArray(options.metrics) && options.metrics.length > 0 ? options.metrics : undefined;
  const url = new URL(`https://www.etsy.com/api/v3/ajax/public/shops/${encodeURIComponent(shopId)}/dashboard/overview`);
  url.searchParams.set("period", period);
  if (metrics) {
    url.searchParams.set("metrics", metrics.join(","));
  }
  url.searchParams.set("include", "traffic,revenue,orders,favorites");
  return url.toString();
}

export async function fetchShopMetrics(shopId: string, options: FetchShopMetricsOptions = {}): Promise<unknown> {
  const normalized = shopId?.trim();
  if (!normalized) {
    throw new Error("Missing required parameter: shopId");
  }

  const apiKey = process.env.ZENROWS_API_KEY;
  if (!apiKey) {
    throw new Error("ZENROWS_API_KEY environment variable is not set");
  }

  const baseUrl = buildMetricsUrl(normalized, options);
  const zenrowsUrl = `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent(baseUrl)}&premium_proxy=true`;

  console.log("Shop Metrics ZenRows URL:", zenrowsUrl); // DEBUG

  const response = await fetch(zenrowsUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  const text = await response.text();
  console.log("Shop Metrics RAW RESPONSE (first 500 chars):", text.slice(0, 500)); // DEBUG

  try {
    return JSON.parse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error("Failed to parse shop metrics JSON from ZenRows: " + message);
  }
}
