import { fetchShopProfile } from "./etsyShopProfileClient.js";
import { parseShopProfile } from "./parser.js";
export async function getShopProfile(shopId) {
    if (!shopId || shopId.trim().length === 0) {
        throw new Error("Missing required parameter: shopId");
    }
    const raw = await fetchShopProfile(shopId);
    const profile = parseShopProfile(raw);
    return { profile, raw };
}
export async function fetchProfile({ shop_id }) {
    return getShopProfile(shop_id);
}
