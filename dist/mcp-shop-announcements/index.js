import { fetchShopAnnouncements } from "./etsyShopAnnouncementsClient.js";
import { parseAnnouncement } from "./parser.js";
export async function getShopAnnouncement(shopId) {
    if (!shopId || shopId.trim().length === 0) {
        throw new Error("Missing required parameter: shopId");
    }
    const raw = await fetchShopAnnouncements(shopId.trim());
    const announcement = parseAnnouncement(raw);
    return { announcement, raw };
}
export async function fetchAnnouncement({ shop_id }) {
    return getShopAnnouncement(shop_id);
}
