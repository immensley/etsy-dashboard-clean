function toNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return 0;
}
function filterStrings(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .filter((entry) => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}
function normalizeState(value) {
    if (typeof value === "string" && value.trim().length > 0) {
        return value;
    }
    if (typeof value === "number") {
        switch (value) {
            case 0:
                return "active";
            case 1:
                return "inactive";
            default:
                return String(value);
        }
    }
    return "unknown";
}
function extractImageUrl(item) {
    var _a, _b, _c;
    if (!item) {
        return null;
    }
    const directImage = item.image;
    if (typeof directImage === "string" && directImage.trim().length > 0) {
        return directImage;
    }
    const images = (_a = item.images) !== null && _a !== void 0 ? _a : item.listing_images;
    if (Array.isArray(images) && images.length > 0) {
        for (const image of images) {
            if (!image) {
                continue;
            }
            if (typeof image === "string") {
                if (image.trim().length > 0) {
                    return image;
                }
                continue;
            }
            const record = image;
            const full = (_c = (_b = record.url_fullxfull) !== null && _b !== void 0 ? _b : record.url) !== null && _c !== void 0 ? _c : record.url_570xN;
            if (typeof full === "string" && full.trim().length > 0) {
                return full;
            }
        }
    }
    return null;
}
function buildPriceDetails(item) {
    if (!item) {
        return null;
    }
    const details = {};
    if ("money_price" in item) {
        details.money_price = item.money_price;
    }
    if ("price_usd" in item) {
        details.price_usd = item.price_usd;
    }
    if ("price_obj" in item) {
        details.price_obj = item.price_obj;
    }
    return Object.keys(details).length > 0 ? details : null;
}
function resolvePrice(value) {
    if (typeof value === "string" || typeof value === "number") {
        return value;
    }
    if (value && typeof value === "object") {
        const amount = value.amount;
        if (amount !== undefined) {
            return amount;
        }
    }
    return "";
}
function resolveFavorites(item) {
    var _a, _b, _c;
    if (!item) {
        return 0;
    }
    const candidate = (_c = (_b = (_a = item.num_favorers) !== null && _a !== void 0 ? _a : item.favorites) !== null && _b !== void 0 ? _b : item.favorite_count) !== null && _c !== void 0 ? _c : item.num_favorited;
    return toNumber(candidate);
}
function resolveInCarts(item) {
    var _a, _b;
    if (!item) {
        return 0;
    }
    const candidate = (_b = (_a = item.in_cart_count) !== null && _a !== void 0 ? _a : item.in_carts) !== null && _b !== void 0 ? _b : item.cart_count;
    return toNumber(candidate);
}
function toParsedListing(item, source = "list") {
    var _a, _b, _c, _d, _e, _f;
    const listingId = (_a = item === null || item === void 0 ? void 0 : item.listing_id) !== null && _a !== void 0 ? _a : "";
    const title = (_b = item === null || item === void 0 ? void 0 : item.title) !== null && _b !== void 0 ? _b : "";
    const price = resolvePrice(item === null || item === void 0 ? void 0 : item.price);
    const currency = (_c = item === null || item === void 0 ? void 0 : item.currency_code) !== null && _c !== void 0 ? _c : "";
    const state = normalizeState(item === null || item === void 0 ? void 0 : item.state);
    const shopName = (_f = (_d = item === null || item === void 0 ? void 0 : item.shop_name) !== null && _d !== void 0 ? _d : (_e = item === null || item === void 0 ? void 0 : item.Shop) === null || _e === void 0 ? void 0 : _e.store_name) !== null && _f !== void 0 ? _f : null;
    const shopUrl = typeof (item === null || item === void 0 ? void 0 : item.shop_url) === "string" ? item.shop_url : null;
    const url = typeof (item === null || item === void 0 ? void 0 : item.url) === "string" ? item.url : null;
    const inCarts = resolveInCarts(item);
    const favorites = resolveFavorites(item);
    const views = toNumber(item === null || item === void 0 ? void 0 : item.views);
    const description = typeof (item === null || item === void 0 ? void 0 : item.description) === "string" ? item.description.trim() : "";
    const tags = filterStrings(item === null || item === void 0 ? void 0 : item.tags);
    const materials = filterStrings(item === null || item === void 0 ? void 0 : item.materials);
    const priceDetails = buildPriceDetails(item);
    const imageUrl = extractImageUrl(item);
    const rawList = source === "list" ? item !== null && item !== void 0 ? item : null : null;
    const rawDetail = source === "detail" ? item !== null && item !== void 0 ? item : null : null;
    const result = {
        listing_id: listingId,
        title,
        price,
        currency,
        state,
        in_carts: inCarts,
        favorites,
        views,
    };
    if (shopName && shopName.trim().length > 0) {
        result.shop_name = shopName;
    }
    if (shopUrl && shopUrl.trim().length > 0) {
        result.shop_url = shopUrl;
    }
    if (url && url.trim().length > 0) {
        result.url = url;
    }
    if (description && description.length > 0) {
        result.description = description;
    }
    if (tags.length > 0) {
        result.tags = tags;
    }
    if (materials.length > 0) {
        result.materials = materials;
    }
    if (priceDetails) {
        result.price_details = priceDetails;
    }
    if (rawList) {
        result.raw_list = rawList;
    }
    if (rawDetail) {
        result.raw_detail = rawDetail;
    }
    if (imageUrl) {
        result.images = [imageUrl];
    }
    if (result.tags && result.tags.length === 0) {
        delete result.tags;
    }
    if (result.materials && result.materials.length === 0) {
        delete result.materials;
    }
    return result;
}
export function parseListings(data) {
    if (Array.isArray(data)) {
        return data.map((item) => toParsedListing(item && typeof item === "object" ? item : undefined, "list"));
    }
    if (!data || typeof data !== "object") {
        return [];
    }
    const response = data;
    if (!response.results || !Array.isArray(response.results)) {
        return [];
    }
    return response.results.map((item) => toParsedListing(item, "list"));
}
export function parseSingleListing(data) {
    if (data && typeof data === "object") {
        if ("listing_id" in data) {
            return toParsedListing(data, "detail");
        }
        const response = data;
        if (response.results && Array.isArray(response.results) && response.results.length > 0) {
            return toParsedListing(response.results[0], "detail");
        }
    }
    const [first] = parseListings(data);
    return first !== null && first !== void 0 ? first : null;
}
