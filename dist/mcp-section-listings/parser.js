function toString(value) {
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
    }
    return undefined;
}
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
    return undefined;
}
function toBoolean(value) {
    if (typeof value === "boolean") {
        return value;
    }
    return undefined;
}
function toStringArray(value) {
    if (!Array.isArray(value)) {
        return undefined;
    }
    const result = value
        .map((item) => toString(item))
        .filter((item) => Boolean(item));
    return result.length > 0 ? result : undefined;
}
const BASE_KEYS = new Set([
    "listing_id",
    "shop_id",
    "shop_name",
    "shop_url",
    "title",
    "price",
    "quantity",
    "currency_code",
    "url",
    "state",
    "is_download",
    "accepts_gift_card",
    "image",
    "image170",
    "img",
    "listing_images",
    "images",
    "logging",
    "for_public_consumption",
    "create_date",
    "has_variations",
    "has_color_variations",
    "is_sold_out",
    "logging_key",
    "shop",
    "price_formatted",
    "price_formatted_short",
    "price_unformatted",
    "price_int",
    "currency_symbol",
    "discounted_price",
    "discount_description",
    "discount_description_unescaped",
    "discounted_price_int_usd",
    "discounted_price_unformatted",
    "free_shipping_countries",
    "free_shipping_data",
    "transit_details_manual",
    "transit_details_calculated",
    "ships_to_regions",
    "origin_country_id",
    "origin_postal_code",
    "min_processing_days",
    "max_processing_days",
    "is_buyer_promise_eligible",
    "is_machine_translated",
    "is_bestseller",
    "is_bestseller_by_fixed_qty_category_leaf",
    "is_bestseller_by_fixed_qty_category_l3",
    "is_scarce",
    "is_handmade",
    "is_customizable",
    "is_personalizable",
    "has_variations_with_pricing",
    "last_sale_date",
    "is_vintage",
    "is_unique",
    "is_in_merch_library",
    "shop_average_rating",
    "shop_total_rating_count",
    "use_pretty_pricing",
    "country_specific_pricing",
    "lowest_purchasable_price",
    "style_attributes",
    "is_surfaceable",
    "for_pattern_consumption",
    "is_vacation",
    "is_pattern",
    "is_retail",
    "signal_pecking_order",
    "has_manually_adjusted_thumbnail",
    "is_listing_image_landscape",
    "is_top_rated",
    "in_cart_count",
    "original_create_date",
    "ships_to_regions",
    "prolist_debug_data",
    "has_star_seller_signal",
    "suppression_restrictions",
    "can_be_waitlisted",
    "is_private",
    "variations_data",
    "num_color_variations",
    "num_size_variations",
    "should_show_buy_it_now_button",
    "buy_it_now_details",
    "is_made_to_order",
    "are_returns_accepted",
    "are_exchanges_accepted",
    "return_deadline_in_days",
    "promotions",
    "promotion_data",
]);
function collectImages(listing) {
    var _a;
    const media = {};
    const primaryImage = (_a = toString(listing.image)) !== null && _a !== void 0 ? _a : toString(listing.image170);
    if (primaryImage) {
        media.primary_image = primaryImage;
    }
    const fromImg = listing.img;
    const urls = new Set();
    if (primaryImage) {
        urls.add(primaryImage);
    }
    if (fromImg) {
        for (const value of Object.values(fromImg)) {
            const str = toString(value);
            if (str) {
                urls.add(str);
            }
        }
    }
    const listingImages = listing.listing_images;
    if (Array.isArray(listingImages)) {
        for (const item of listingImages) {
            if (item && typeof item === "object") {
                const record = item;
                for (const value of Object.values(record)) {
                    const str = toString(value);
                    if (str && (str.startsWith("http://") || str.startsWith("https://"))) {
                        urls.add(str);
                    }
                }
            }
        }
    }
    if (urls.size > 0) {
        media.all_images = Array.from(urls);
    }
    const imageKeys = listing.images;
    if (Array.isArray(imageKeys)) {
        const filtered = imageKeys
            .map((key) => toString(key))
            .filter((key) => Boolean(key));
        if (filtered.length > 0) {
            media.image_keys = filtered;
        }
    }
    return Object.keys(media).length > 0 ? media : undefined;
}
function collectShop(listing) {
    var _a;
    const summary = {};
    const shopId = toNumber(listing.shop_id);
    if (shopId !== undefined) {
        summary.shop_id = shopId;
    }
    const shopName = toString(listing.shop_name);
    if (shopName) {
        summary.shop_name = shopName;
    }
    const shopUrl = toString(listing.shop_url);
    if (shopUrl) {
        summary.shop_url = shopUrl;
    }
    const inlineShop = listing.shop;
    if (inlineShop) {
        const inlineName = toString((_a = inlineShop.store_name) !== null && _a !== void 0 ? _a : inlineShop.shop_name);
        if (inlineName && !summary.shop_name) {
            summary.shop_name = inlineName;
        }
        const inlineUrl = toString(inlineShop.url);
        if (inlineUrl && !summary.shop_url) {
            summary.shop_url = inlineUrl;
        }
        const inlineId = toNumber(inlineShop.shop_id);
        if (inlineId !== undefined && summary.shop_id === undefined) {
            summary.shop_id = inlineId;
        }
    }
    return Object.keys(summary).length > 0 ? summary : undefined;
}
function collectLogging(listing) {
    const logging = listing.logging;
    if (logging && typeof logging === "object") {
        return logging;
    }
    return undefined;
}
function collectPricing(listing) {
    const summary = {};
    const display = toString(listing.price_formatted);
    if (display) {
        summary.display = display;
    }
    const displayShort = toString(listing.price_formatted_short);
    if (displayShort) {
        summary.display_short = displayShort;
    }
    const unformatted = listing.price_unformatted;
    if (unformatted !== undefined) {
        summary.amount_unformatted = unformatted;
    }
    const priceInt = toNumber(listing.price_int);
    if (priceInt !== undefined) {
        summary.amount_int = priceInt;
    }
    const currencySymbol = toString(listing.currency_symbol);
    if (currencySymbol) {
        summary.currency_symbol = currencySymbol;
    }
    const logging = listing.logging;
    if (logging) {
        const sellerCurrency = toString(logging.seller_currency);
        if (sellerCurrency) {
            summary.seller_currency = sellerCurrency;
        }
        const sellerAmount = logging.seller_currency_price;
        if (sellerAmount !== undefined) {
            summary.seller_amount = sellerAmount;
        }
    }
    return Object.keys(summary).length > 0 ? summary : undefined;
}
function collectDiscount(listing) {
    const summary = {};
    const price = listing.discounted_price;
    if (price !== undefined) {
        summary.price = price;
    }
    const description = toString(listing.discount_description);
    if (description) {
        summary.description = description;
    }
    const descriptionUnescaped = toString(listing.discount_description_unescaped);
    if (descriptionUnescaped) {
        summary.description_unescaped = descriptionUnescaped;
    }
    const priceIntUsd = toNumber(listing.discounted_price_int_usd);
    if (priceIntUsd !== undefined) {
        summary.price_int_usd = priceIntUsd;
    }
    const priceUnformatted = listing.discounted_price_unformatted;
    if (priceUnformatted !== undefined) {
        summary.price_unformatted = priceUnformatted;
    }
    return Object.keys(summary).length > 0 ? summary : undefined;
}
function collectDelivery(listing) {
    const summary = {};
    const freeCountries = toStringArray(listing.free_shipping_countries);
    if (freeCountries) {
        summary.free_shipping_countries = freeCountries;
    }
    const freeShippingData = listing.free_shipping_data;
    if (freeShippingData && typeof freeShippingData === "object") {
        summary.free_shipping_data = freeShippingData;
    }
    const transitManual = listing.transit_details_manual;
    if (Array.isArray(transitManual) && transitManual.length > 0) {
        summary.transit_details_manual = transitManual;
    }
    const transitCalculated = listing.transit_details_calculated;
    if (transitCalculated && typeof transitCalculated === "object") {
        summary.transit_details_calculated = transitCalculated;
    }
    else if (transitCalculated === null) {
        summary.transit_details_calculated = null;
    }
    const shipsTo = toStringArray(listing.ships_to_regions);
    if (shipsTo) {
        summary.ships_to_regions = shipsTo;
    }
    const originCountry = toNumber(listing.origin_country_id);
    if (originCountry !== undefined) {
        summary.origin_country_id = originCountry;
    }
    const originPostal = toString(listing.origin_postal_code);
    if (originPostal) {
        summary.origin_postal_code = originPostal;
    }
    const minProcessing = toNumber(listing.min_processing_days);
    if (minProcessing !== undefined) {
        summary.min_processing_days = minProcessing;
    }
    const maxProcessing = toNumber(listing.max_processing_days);
    if (maxProcessing !== undefined) {
        summary.max_processing_days = maxProcessing;
    }
    const buyerPromise = toBoolean(listing.is_buyer_promise_eligible);
    if (buyerPromise !== undefined) {
        summary.is_buyer_promise_eligible = buyerPromise;
    }
    return Object.keys(summary).length > 0 ? summary : undefined;
}
function collectFlags(listing) {
    const summary = {};
    const pairs = [
        ["is_machine_translated", listing.is_machine_translated],
        ["is_bestseller", listing.is_bestseller],
        ["is_bestseller_leaf", listing.is_bestseller_by_fixed_qty_category_leaf],
        ["is_bestseller_l3", listing.is_bestseller_by_fixed_qty_category_l3],
        ["is_scarce", listing.is_scarce],
        ["is_handmade", listing.is_handmade],
        ["is_customizable", listing.is_customizable],
        ["is_personalizable", listing.is_personalizable],
        ["has_variations_with_pricing", listing.has_variations_with_pricing],
        ["is_vintage", listing.is_vintage],
        ["is_unique", listing.is_unique],
        ["is_in_merch_library", listing.is_in_merch_library],
        ["is_surfaceable", listing.is_surfaceable],
        ["for_pattern_consumption", listing.for_pattern_consumption],
        ["is_vacation", listing.is_vacation],
        ["is_pattern", listing.is_pattern],
        ["is_retail", listing.is_retail],
        ["has_manually_adjusted_thumbnail", listing.has_manually_adjusted_thumbnail],
        ["is_listing_image_landscape", listing.is_listing_image_landscape],
        ["is_top_rated", listing.is_top_rated],
        ["has_star_seller_signal", listing.has_star_seller_signal],
        ["can_be_waitlisted", listing.can_be_waitlisted],
        ["is_private", listing.is_private],
        ["should_show_buy_it_now_button", listing.should_show_buy_it_now_button],
        ["is_made_to_order", listing.is_made_to_order],
        ["are_returns_accepted", listing.are_returns_accepted],
        ["are_exchanges_accepted", listing.are_exchanges_accepted],
    ];
    for (const [key, value] of pairs) {
        const bool = toBoolean(value);
        if (bool !== undefined) {
            summary[key] = bool;
        }
    }
    return Object.keys(summary).length > 0 ? summary : undefined;
}
function collectEngagement(listing) {
    const summary = {};
    const inCart = toNumber(listing.in_cart_count);
    if (inCart !== undefined) {
        summary.in_cart_count = inCart;
    }
    const avgRating = toNumber(listing.shop_average_rating);
    if (avgRating !== undefined) {
        summary.shop_average_rating = avgRating;
    }
    const totalRating = toNumber(listing.shop_total_rating_count);
    if (totalRating !== undefined) {
        summary.shop_total_rating_count = totalRating;
    }
    const lastSale = toNumber(listing.last_sale_date);
    if (lastSale !== undefined) {
        summary.last_sale_date = lastSale;
    }
    const originalCreate = toNumber(listing.original_create_date);
    if (originalCreate !== undefined) {
        summary.original_create_date = originalCreate;
    }
    const createDate = toNumber(listing.create_date);
    if (createDate !== undefined) {
        summary.create_date = createDate;
    }
    const returnDeadline = toNumber(listing.return_deadline_in_days);
    if (returnDeadline !== undefined) {
        summary.return_deadline_in_days = returnDeadline;
    }
    return Object.keys(summary).length > 0 ? summary : undefined;
}
function collectVariation(listing) {
    const summary = {};
    const numColor = toNumber(listing.num_color_variations);
    if (numColor !== undefined) {
        summary.num_color_variations = numColor;
    }
    const numSize = toNumber(listing.num_size_variations);
    if (numSize !== undefined) {
        summary.num_size_variations = numSize;
    }
    const variationsData = listing.variations_data;
    if (variationsData !== undefined) {
        summary.variations_data = variationsData;
    }
    const promotions = listing.promotions;
    if (promotions !== undefined) {
        summary.promotions = promotions;
    }
    const promotionData = listing.promotion_data;
    if (promotionData && typeof promotionData === "object") {
        summary.promotion_data = promotionData;
    }
    const signal = listing.signal_pecking_order;
    if (Array.isArray(signal) && signal.length > 0) {
        summary.signal_pecking_order = signal;
    }
    const styleAttributes = listing.style_attributes;
    if (Array.isArray(styleAttributes) && styleAttributes.length > 0) {
        summary.style_attributes = styleAttributes;
    }
    const suppression = toStringArray(listing.suppression_restrictions);
    if (suppression) {
        summary.suppression_restrictions = suppression;
    }
    const countryPricing = listing.country_specific_pricing;
    if (countryPricing && typeof countryPricing === "object") {
        summary.country_specific_pricing = countryPricing;
    }
    const lowestPrice = listing.lowest_purchasable_price;
    if (lowestPrice && typeof lowestPrice === "object") {
        summary.lowest_purchasable_price = lowestPrice;
    }
    return Object.keys(summary).length > 0 ? summary : undefined;
}
function collectAttributes(listing) {
    const attributes = {};
    for (const [key, value] of Object.entries(listing)) {
        if (BASE_KEYS.has(key)) {
            continue;
        }
        attributes[key] = value;
    }
    return Object.keys(attributes).length > 0 ? attributes : undefined;
}
function toParsedListing(raw) {
    var _a;
    const listingId = (_a = raw.listing_id) !== null && _a !== void 0 ? _a : raw.id;
    if (listingId === undefined) {
        return undefined;
    }
    const listing = {
        listing_id: listingId,
        raw,
    };
    const title = toString(raw.title);
    if (title) {
        listing.title = title;
    }
    const price = raw.price;
    if (price !== undefined && price !== null) {
        listing.price = price;
    }
    const currency = toString(raw.currency_code);
    if (currency) {
        listing.currency_code = currency;
    }
    const quantity = toNumber(raw.quantity);
    if (quantity !== undefined) {
        listing.quantity = quantity;
    }
    const state = raw.state;
    if (typeof state === "string") {
        listing.state = state;
    }
    else if (typeof state === "number") {
        listing.state = String(state);
    }
    const url = toString(raw.url);
    if (url) {
        listing.url = url;
    }
    const isDownload = toBoolean(raw.is_download);
    if (isDownload !== undefined) {
        listing.is_download = isDownload;
    }
    const acceptsGiftCard = toBoolean(raw.accepts_gift_card);
    if (acceptsGiftCard !== undefined) {
        listing.accepts_gift_card = acceptsGiftCard;
    }
    const media = collectImages(raw);
    if (media) {
        listing.media = media;
    }
    const shop = collectShop(raw);
    if (shop) {
        listing.shop = shop;
    }
    const pricing = collectPricing(raw);
    if (pricing) {
        listing.pricing = pricing;
    }
    const discount = collectDiscount(raw);
    if (discount) {
        listing.discount = discount;
    }
    const delivery = collectDelivery(raw);
    if (delivery) {
        listing.delivery = delivery;
    }
    const flags = collectFlags(raw);
    if (flags) {
        listing.flags = flags;
        if (flags.is_top_rated !== undefined) {
            listing.is_top_rated = flags.is_top_rated;
        }
        if (flags.is_bestseller !== undefined) {
            listing.is_bestseller = flags.is_bestseller;
        }
        if (flags.is_customizable !== undefined) {
            listing.is_customizable = flags.is_customizable;
        }
        if (flags.is_personalizable !== undefined) {
            listing.is_personalizable = flags.is_personalizable;
        }
        if (flags.has_star_seller_signal !== undefined) {
            listing.has_star_seller_signal = flags.has_star_seller_signal;
        }
        if (flags.is_handmade !== undefined) {
            listing.is_handmade = flags.is_handmade;
        }
    }
    const engagement = collectEngagement(raw);
    if (engagement) {
        listing.engagement = engagement;
        if (engagement.in_cart_count !== undefined) {
            listing.in_carts = engagement.in_cart_count;
        }
    }
    const variation = collectVariation(raw);
    if (variation) {
        listing.variation = variation;
    }
    const logging = collectLogging(raw);
    if (logging) {
        listing.logging = logging;
    }
    const attributes = collectAttributes(raw);
    if (attributes) {
        listing.attributes = attributes;
    }
    return listing;
}
function normalizeResponse(data) {
    if (Array.isArray(data)) {
        return data;
    }
    if (data && typeof data === "object") {
        const container = data;
        if (Array.isArray(container.listings)) {
            return container.listings;
        }
        if (Array.isArray(container.results)) {
            return container.results;
        }
    }
    return [];
}
export function parseSectionListings(data) {
    const listings = normalizeResponse(data);
    return listings
        .map((item) => toParsedListing(item))
        .filter((item) => Boolean(item));
}
