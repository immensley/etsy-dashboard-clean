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
function toString(value) {
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
    }
    return undefined;
}
function toId(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
    }
    return undefined;
}
function extractNumberFromRecord(record, keys) {
    for (const key of keys) {
        if (key in record) {
            const value = toNumber(record[key]);
            if (value !== undefined) {
                return value;
            }
        }
    }
    return undefined;
}
function parseOption(raw) {
    var _a;
    const value = (_a = toString(raw.value)) !== null && _a !== void 0 ? _a : toString(raw.values && raw.values[0]);
    const propertyName = toString(raw.property_name);
    if (!value && !propertyName) {
        return undefined;
    }
    const propertyId = toNumber(raw.property_id);
    const valueId = toNumber(raw.value_id);
    const option = {
        value: value !== null && value !== void 0 ? value : "",
    };
    if (propertyName) {
        option.property_name = propertyName;
    }
    if (propertyId !== undefined) {
        option.property_id = propertyId;
    }
    if (valueId !== undefined) {
        option.value_id = valueId;
    }
    return option;
}
function parsePrice(value) {
    var _a;
    if (!value) {
        return {};
    }
    if (typeof value === "number" || typeof value === "string") {
        return { amount: toNumber(value) };
    }
    if (typeof value === "object") {
        const record = value;
        const amount = extractNumberFromRecord(record, ["amount", "value", "price", "usd"]); // heuristics
        const currency = toString((_a = record.currency_code) !== null && _a !== void 0 ? _a : record.currency);
        return {
            amount,
            currency,
        };
    }
    return {};
}
function parseOffering(raw) {
    const offeringId = toNumber(raw.offering_id);
    const quantity = toNumber(raw.quantity);
    const sku = toString(raw.sku);
    const { amount, currency } = parsePrice(raw.price);
    const isEnabled = typeof raw.is_enabled === "boolean" ? raw.is_enabled : undefined;
    const isAvailable = typeof raw.is_available === "boolean" ? raw.is_available : undefined;
    const inventoryLevel = toString(raw.inventory_level);
    const minProcessing = toNumber(raw.min_processing_days);
    const maxProcessing = toNumber(raw.max_processing_days);
    const derivedCurrency = currency !== null && currency !== void 0 ? currency : toString(raw.currency_code);
    const offering = {};
    if (offeringId !== undefined) {
        offering.offering_id = offeringId;
    }
    if (amount !== undefined) {
        offering.price = amount;
    }
    if (derivedCurrency) {
        offering.currency = derivedCurrency;
    }
    if (quantity !== undefined) {
        offering.quantity = quantity;
    }
    if (sku) {
        offering.sku = sku;
    }
    if (isEnabled !== undefined) {
        offering.is_enabled = isEnabled;
    }
    if (isAvailable !== undefined) {
        offering.is_available = isAvailable;
    }
    if (inventoryLevel) {
        offering.inventory_level = inventoryLevel;
    }
    if (minProcessing !== undefined || maxProcessing !== undefined) {
        offering.processing_days = {};
        if (minProcessing !== undefined) {
            offering.processing_days.min = minProcessing;
        }
        if (maxProcessing !== undefined) {
            offering.processing_days.max = maxProcessing;
        }
    }
    if (offering.offering_id === undefined &&
        offering.price === undefined &&
        offering.quantity === undefined &&
        !offering.sku &&
        !offering.inventory_level) {
        return undefined;
    }
    return offering;
}
function parseVariant(raw) {
    var _a;
    const productId = toId((_a = raw.product_id) !== null && _a !== void 0 ? _a : raw.id);
    if (productId === undefined) {
        return undefined;
    }
    const optionsRaw = Array.isArray(raw.property_values) ? raw.property_values : [];
    const offeringsRaw = Array.isArray(raw.offerings) ? raw.offerings : [];
    const options = optionsRaw
        .map((item) => parseOption(item))
        .filter((item) => Boolean(item));
    const offerings = offeringsRaw
        .map((item) => parseOffering(item))
        .filter((item) => Boolean(item));
    const variant = {
        product_id: productId,
        options,
        offerings,
        raw,
    };
    const available = typeof raw.is_available === "boolean" ? raw.is_available : undefined;
    const sku = toString(raw.sku);
    if (available !== undefined) {
        variant.is_available = available;
    }
    if (sku) {
        variant.sku = sku;
    }
    return variant;
}
function extractInventory(raw) {
    if (raw.inventory && typeof raw.inventory === "object") {
        return raw.inventory;
    }
    if (Array.isArray(raw.results) && raw.results.length > 0) {
        const [first] = raw.results;
        if (first && typeof first === "object") {
            const record = first;
            if (record.inventory && typeof record.inventory === "object") {
                return record.inventory;
            }
            return extractInventory(record);
        }
    }
    return undefined;
}
function coerceListing(data) {
    if (data && typeof data === "object") {
        return data;
    }
    return {};
}
function sumQuantities(variants) {
    let total = 0;
    let hasQuantity = false;
    for (const variant of variants) {
        for (const offering of variant.offerings) {
            if (offering.quantity !== undefined) {
                total += offering.quantity;
                hasQuantity = true;
            }
        }
    }
    return hasQuantity ? total : undefined;
}
export function parseInventory(data) {
    var _a;
    const listing = coerceListing(data);
    const listingId = toId((_a = listing.listing_id) !== null && _a !== void 0 ? _a : listing.listingId);
    if (listingId === undefined) {
        return null;
    }
    const inventory = extractInventory(listing);
    if (!inventory) {
        const hasVariationsFlag = typeof listing.has_variations === "boolean" ? listing.has_variations : undefined;
        const fallbackSummary = {
            listing_id: listingId,
            title: toString(listing.title),
            variants: [],
            raw: listing,
        };
        if (hasVariationsFlag !== undefined) {
            fallbackSummary.has_variations = hasVariationsFlag;
        }
        return fallbackSummary;
    }
    const products = Array.isArray(inventory.products) ? inventory.products : [];
    const variants = products
        .map((product) => parseVariant(product))
        .filter((variant) => Boolean(variant));
    const totalAvailable = sumQuantities(variants);
    const quantityOnHand = toNumber(inventory.quantity_on_hand);
    const lowStockThreshold = toNumber(inventory.low_inventory_threshold);
    const hasVariationsFlag = typeof listing.has_variations === "boolean" ? listing.has_variations : undefined;
    const summary = {
        listing_id: listingId,
        title: toString(listing.title),
        variants,
        raw: listing,
    };
    if (hasVariationsFlag !== undefined) {
        summary.has_variations = hasVariationsFlag;
    }
    else if (variants.length > 1) {
        summary.has_variations = true;
    }
    if (totalAvailable !== undefined) {
        summary.total_available = totalAvailable;
    }
    if (quantityOnHand !== undefined) {
        summary.quantity_on_hand = quantityOnHand;
    }
    if (lowStockThreshold !== undefined) {
        summary.low_stock_threshold = lowStockThreshold;
    }
    return summary;
}
