import { fetchReviewInsights } from "./etsyReviewInsightsClient.js";
import { parseReviewInsights } from "./parser.js";
export async function getReviewInsights(shopId, options = {}) {
    if (!shopId || shopId.trim().length === 0) {
        throw new Error("Missing required parameter: shopId");
    }
    const raw = await fetchReviewInsights(Object.assign({ shopId: shopId.trim() }, options));
    const insights = parseReviewInsights(raw);
    return { insights, raw };
}
export async function fetchInsights({ shop_id, limit, offset }) {
    return getReviewInsights(shop_id, { limit, offset });
}
