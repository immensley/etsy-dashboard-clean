function toId(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
        return value;
    }
    return "";
}
function toStringOrNull(value) {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    return null;
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
    return 0;
}
function toNumberOrNull(value) {
    if (value === null || value === undefined) {
        return null;
    }
    const numeric = toNumber(value);
    return Number.isNaN(numeric) ? null : numeric;
}
function safeArray(value) {
    return Array.isArray(value) ? [...value] : [];
}
const KNOWN_KEYS = new Set([
    "shop_section_id",
    "section_id",
    "title",
    "title_machine_translated",
    "active_listing_count",
    "rank",
    "listings",
    "listings_count",
    "count",
    "path",
    "url",
    "shop_id",
    "user_id",
    "slug",
    "language",
    "default_language",
    "create_date",
    "update_date",
]);
function extractAttributes(raw) {
    const attributes = {};
    for (const [key, value] of Object.entries(raw)) {
        if (KNOWN_KEYS.has(key)) {
            continue;
        }
        if (Array.isArray(value)) {
            const primitives = value.every((item) => item === null || ["string", "number", "boolean"].includes(typeof item));
            if (primitives) {
                const filtered = value.filter((item) => item !== null);
                if (filtered.length > 0) {
                    attributes[key] = filtered;
                }
            }
            else if (value.length > 0) {
                attributes[key] = value;
            }
            continue;
        }
        if (["string", "number", "boolean"].includes(typeof value)) {
            attributes[key] = value;
            continue;
        }
        if (typeof value === "object") {
            attributes[key] = value;
            continue;
        }
    }
    return attributes;
}
function toParsedSection(item) {
    var _a, _b, _c, _d;
    const raw = (item && typeof item === "object") ? item : {};
    const sectionId = toId((_a = raw.shop_section_id) !== null && _a !== void 0 ? _a : raw.section_id);
    const title = (_b = toStringOrNull(raw.title)) !== null && _b !== void 0 ? _b : "";
    const machineTitle = toStringOrNull(raw.title_machine_translated);
    const activeCount = toNumber(raw.active_listing_count);
    const rank = toNumberOrNull(raw.rank);
    const listings = safeArray(raw.listings);
    const listingsCount = toNumber((_d = (_c = raw.listings_count) !== null && _c !== void 0 ? _c : raw.count) !== null && _d !== void 0 ? _d : listings.length);
    const attributes = extractAttributes(raw);
    const result = {
        section_id: sectionId,
        title,
        active_listing_count: activeCount,
        listings_count: listingsCount,
        raw,
    };
    if (machineTitle) {
        result.title_machine_translated = machineTitle;
    }
    if (typeof rank === "number") {
        result.rank = rank;
    }
    if (Object.keys(attributes).length > 0) {
        result.attributes = attributes;
    }
    if (listings.length > 0) {
        result.listings = listings;
    }
    return result;
}
export function parseSections(data) {
    var _a;
    if (Array.isArray(data)) {
        return data.map((item) => toParsedSection(item));
    }
    if (data && typeof data === "object") {
        const container = data;
        const candidates = (_a = container.sections) !== null && _a !== void 0 ? _a : container.results;
        if (Array.isArray(candidates)) {
            return candidates.map((item) => toParsedSection(item));
        }
    }
    return [];
}
