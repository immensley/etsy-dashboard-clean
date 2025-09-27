import { fetchShopReviews } from "./etsyReviewsClient.js";
import { parseReviews, type ParsedReviewGroup } from "./parser.js";

export interface GetShopReviewsParams {
  shopId: string;
  limit?: number;
  offset?: number;
}

export interface ReviewsPayload {
  reviews: ParsedReviewGroup[];
  raw: unknown;
}

export async function getShopReviews({ shopId, limit, offset }: GetShopReviewsParams): Promise<ReviewsPayload> {
  const data = await fetchShopReviews({ shopId, limit, offset });
  const reviews = parseReviews(data);

  return { reviews, raw: data };
}

export async function fetchReviews(params: GetShopReviewsParams): Promise<ReviewsPayload> {
  return getShopReviews(params);
}

export type { ParsedReviewGroup, ParsedReviewEntry, BuyerInfo, ListingSummary } from "./parser.js";
