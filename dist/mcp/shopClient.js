import { fetchShopListings as fetchRawShopListings } from "./etsyClient.js";
import { fetchListing } from "./listingClient.js";
import { parseListings } from "./parser.js";
const DEFAULT_LIMIT = 5;
function normalizeLimit(value) {
    if (value === undefined || value === null || value === "") {
        return DEFAULT_LIMIT;
    }
    const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? DEFAULT_LIMIT : parsed;
}
function hasStringValue(value) {
    return typeof value === "string" && value.trim().length > 0;
}
function mergeListings(base, detail) {
    var _a, _b, _c, _d;
    if (!detail) {
        return base;
    }
    const merged = Object.assign({}, base);
    const basePriceString = typeof base.price === "string" ? base.price.trim() : null;
    const detailPriceString = typeof detail.price === "string" ? detail.price : null;
    const hasBasePrice = typeof base.price === "number" || (basePriceString !== null && basePriceString.length > 0);
    if (!hasBasePrice) {
        merged.price = (_a = detail.price) !== null && _a !== void 0 ? _a : base.price;
    }
    if (!hasStringValue(base.currency) && hasStringValue(detail.currency)) {
        merged.currency = detail.currency;
    }
    if ((!hasStringValue(base.state) || base.state === "unknown") && hasStringValue(detail.state)) {
        merged.state = detail.state;
    }
    if (!merged.shop_name && detail.shop_name) {
        merged.shop_name = detail.shop_name;
    }
    if (!merged.shop_url && detail.shop_url) {
        merged.shop_url = detail.shop_url;
    }
    if (!merged.url && detail.url) {
        merged.url = detail.url;
    }
    merged.in_carts = (_b = detail.in_carts) !== null && _b !== void 0 ? _b : base.in_carts;
    merged.favorites = (_c = detail.favorites) !== null && _c !== void 0 ? _c : base.favorites;
    merged.views = (_d = detail.views) !== null && _d !== void 0 ? _d : base.views;
    if (!merged.description && detail.description) {
        merged.description = detail.description;
    }
    if ((!merged.tags || merged.tags.length === 0) && detail.tags && detail.tags.length > 0) {
        merged.tags = detail.tags;
    }
    if ((!merged.materials || merged.materials.length === 0) && detail.materials && detail.materials.length > 0) {
        merged.materials = detail.materials;
    }
    if (detail.images && detail.images.length > 0) {
        merged.images = detail.images;
    }
    if (!merged.price_details && detail.price_details) {
        merged.price_details = detail.price_details;
    }
    if (!merged.raw_list && detail.raw_list) {
        merged.raw_list = detail.raw_list;
    }
    if (detail.raw_detail) {
        merged.raw_detail = detail.raw_detail;
    }
    return merged;
}
export async function fetchShopListings({ shopId, sectionId, limit, }) {
    if (!shopId) {
        throw new Error("Missing required parameter: shop_id");
    }
    const normalizedLimit = normalizeLimit(limit);
    const data = await fetchRawShopListings(shopId, sectionId, normalizedLimit);
    const listings = parseListings(data);
    const detailResults = await Promise.all(listings.map(async (listing) => {
        const id = listing.listing_id;
        if (!id && id !== 0) {
            return null;
        }
        try {
            return await fetchListing(id);
        }
        catch (error) {
            console.warn("Failed to fetch listing detail", id, error);
            return null;
        }
    }));
    const enriched = listings.map((listing, index) => mergeListings(listing, detailResults[index]));
    return { listings: enriched };
}
