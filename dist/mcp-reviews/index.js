import { fetchShopReviews } from "./etsyReviewsClient.js";
import { parseReviews } from "./parser.js";
export async function getShopReviews({ shopId, limit, offset }) {
    const data = await fetchShopReviews({ shopId, limit, offset });
    const reviews = parseReviews(data);
    return { reviews, raw: data };
}
export async function fetchReviews(params) {
    return getShopReviews(params);
}
