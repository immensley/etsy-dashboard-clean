import { fetchReviewInsights, type FetchReviewInsightsParams } from "./etsyReviewInsightsClient.js";
import { parseReviewInsights, type ReviewInsights } from "./parser.js";

export interface ReviewInsightsPayload {
  insights: ReviewInsights;
  raw: unknown;
}

export async function getReviewInsights(
  shopId: string,
  options: Omit<FetchReviewInsightsParams, "shopId"> = {},
): Promise<ReviewInsightsPayload> {
  if (!shopId || shopId.trim().length === 0) {
    throw new Error("Missing required parameter: shopId");
  }

  const raw = await fetchReviewInsights({ shopId: shopId.trim(), ...options });
  const insights = parseReviewInsights(raw);

  return { insights, raw };
}

export async function fetchInsights({ shop_id, limit, offset }: { shop_id: string; limit?: number; offset?: number }): Promise<ReviewInsightsPayload> {
  return getReviewInsights(shop_id, { limit, offset });
}

export { type ReviewInsights, type ReviewHighlight, type RatingBucket, type LanguageBucket } from "./parser.js";
