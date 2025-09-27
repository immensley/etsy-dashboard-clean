import { fetchShopListings } from "./shopClient.js";
import { fetchListing } from "./listingClient.js";
export async function getShopData(shopId, sectionId, limit, offset) {
    return fetchShopListings({ shopId, sectionId, limit, offset });
}
export async function getListingData(listingId) {
    return fetchListing(listingId);
}
export async function fetchShop({ shop_id, section_id, limit, offset, }) {
    return getShopData(shop_id, section_id, limit, offset);
}
export async function getListing({ listing_id, }) {
    return getListingData(listing_id);
}
// Backwards-compatible alias used by some runners expecting camel-case command names.
export const fetchListingCommand = getListing;
