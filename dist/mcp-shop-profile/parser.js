function toId(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
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
function toNumberOrNull(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return null;
}
function toBoolean(value) {
    if (typeof value === "boolean") {
        return value;
    }
    return undefined;
}
function safeArray(value) {
    return Array.isArray(value) ? value : [];
}
function pickFirstString(...values) {
    for (const candidate of values) {
        const str = toStringOrNull(candidate);
        if (str) {
            return str;
        }
    }
    return undefined;
}
function gatherLocation(raw) {
    var _a, _b, _c, _d;
    const city = toStringOrNull(raw.city);
    const region = (_b = (_a = toStringOrNull(raw.region)) !== null && _a !== void 0 ? _a : toStringOrNull(raw.state)) !== null && _b !== void 0 ? _b : toStringOrNull(raw.state_name);
    const country = (_d = (_c = toStringOrNull(raw.country_name)) !== null && _c !== void 0 ? _c : toStringOrNull(raw.country)) !== null && _d !== void 0 ? _d : toStringOrNull(raw.country_display_name);
    const parts = [city, region, country].filter((part) => Boolean(part));
    if (parts.length === 0) {
        return undefined;
    }
    return parts.join(", ");
}
function gatherImages(raw) {
    var _a;
    const icon = pickFirstString(raw.icon_url_fullxfull, raw.icon_url, (_a = raw.icon) === null || _a === void 0 ? void 0 : _a.url_fullxfull);
    const coverContainer = raw.cover_image;
    const cover = pickFirstString(raw.cover_image_url, raw.cover_photo_url, coverContainer === null || coverContainer === void 0 ? void 0 : coverContainer.url, coverContainer === null || coverContainer === void 0 ? void 0 : coverContainer.url_fullxfull);
    const result = {};
    if (icon) {
        result.icon = icon;
    }
    if (cover) {
        result.cover = cover;
    }
    return result;
}
function gatherOwner(raw) {
    var _a;
    if (!raw) {
        return undefined;
    }
    const owner = {};
    const userId = toNumberOrNull(raw.user_id);
    if (userId !== null) {
        owner.user_id = userId;
    }
    const name = pickFirstString(raw.real_name, raw.display_name, raw.name);
    if (name) {
        owner.name = name;
    }
    const login = (_a = toStringOrNull(raw.login_name)) !== null && _a !== void 0 ? _a : toStringOrNull(raw.login);
    if (login) {
        owner.login_name = login;
    }
    const avatar = pickFirstString(raw.avatar_url_fullxfull, raw.avatar_url, raw.image_url_75x75);
    if (avatar) {
        owner.avatar_url = avatar;
    }
    const favorite = toBoolean(raw.is_favorite);
    if (favorite !== undefined) {
        owner.is_favorite = favorite;
    }
    return Object.keys(owner).length > 0 ? owner : undefined;
}
const SOCIAL_KEYS = {
    instagram: ["instagram", "instagram_url", "instagram_link"],
    facebook: ["facebook", "facebook_url", "facebook_link"],
    twitter: ["twitter", "twitter_url", "twitter_link", "x_url"],
    youtube: ["youtube", "youtube_url", "youtube_link"],
    pinterest: ["pinterest", "pinterest_url", "pinterest_link"],
    tiktok: ["tiktok", "tiktok_url", "tiktok_link"],
};
function gatherSocialLinks(raw) {
    var _a;
    const links = [];
    for (const [platform, candidates] of Object.entries(SOCIAL_KEYS)) {
        for (const candidate of candidates) {
            const link = toStringOrNull(raw[candidate]);
            if (link) {
                links.push({ platform, url: link });
                break;
            }
        }
    }
    const additional = raw.social_links;
    if (Array.isArray(additional)) {
        for (const entry of additional) {
            if (entry && typeof entry === "object") {
                const platform = toStringOrNull((_a = entry.platform) !== null && _a !== void 0 ? _a : entry.name);
                const url = toStringOrNull(entry.url);
                if (platform && url) {
                    const normalizedPlatform = platform.toLowerCase();
                    if (!links.some((item) => item.platform === normalizedPlatform && item.url === url)) {
                        links.push({ platform: normalizedPlatform, url });
                    }
                }
            }
        }
    }
    return links.length > 0 ? links : undefined;
}
function gatherStats(raw) {
    var _a, _b, _c, _d, _e, _f;
    if (!raw) {
        return undefined;
    }
    const stats = {};
    const sales = (_a = toNumberOrNull(raw.sales)) !== null && _a !== void 0 ? _a : toNumberOrNull(raw.transaction_sold_count);
    if (sales !== null) {
        stats.sales = sales;
    }
    const admirers = (_b = toNumberOrNull(raw.admirers)) !== null && _b !== void 0 ? _b : toNumberOrNull(raw.num_favorers);
    if (admirers !== null) {
        stats.admirers = admirers;
    }
    const rating = (_c = toNumberOrNull(raw.rating)) !== null && _c !== void 0 ? _c : toNumberOrNull(raw.average_rating);
    if (rating !== null) {
        stats.rating = rating;
    }
    const reviewCount = (_e = (_d = toNumberOrNull(raw.review_count)) !== null && _d !== void 0 ? _d : toNumberOrNull(raw.reviews)) !== null && _e !== void 0 ? _e : toNumberOrNull(raw.total_reviews);
    if (reviewCount !== null) {
        stats.review_count = reviewCount;
    }
    const listingCount = (_f = toNumberOrNull(raw.listing_count)) !== null && _f !== void 0 ? _f : toNumberOrNull(raw.active_listing_count);
    if (listingCount !== null) {
        stats.listing_count = listingCount;
    }
    return Object.keys(stats).length > 0 ? stats : undefined;
}
function gatherLanguages(raw) {
    var _a;
    const languages = safeArray(raw.languages)
        .map((value) => toStringOrNull(value))
        .filter((value) => Boolean(value));
    if (languages.length > 0) {
        return Array.from(new Set(languages));
    }
    const language = toStringOrNull((_a = raw.language) !== null && _a !== void 0 ? _a : raw.default_language);
    if (language) {
        return [language];
    }
    return undefined;
}
function toTimestamp(value) {
    const numeric = toNumberOrNull(value);
    if (numeric !== null) {
        return numeric;
    }
    if (typeof value === "string") {
        const parsed = Date.parse(value);
        if (!Number.isNaN(parsed)) {
            return Math.floor(parsed / 1000);
        }
    }
    return undefined;
}
function coerceRaw(data) {
    if (data && typeof data === "object") {
        if ("shop" in data && data.shop && typeof data.shop === "object") {
            return data.shop;
        }
        return data;
    }
    return {};
}
export function parseShopProfile(data) {
    var _a, _b, _c, _d, _e, _f;
    const raw = coerceRaw(data);
    const shopId = toId((_b = (_a = raw.shop_id) !== null && _a !== void 0 ? _a : raw.shopId) !== null && _b !== void 0 ? _b : raw.shopID);
    if (shopId === "") {
        return null;
    }
    const shopName = pickFirstString(raw.shop_name, raw.name, raw.title);
    const headline = pickFirstString(raw.headline, raw.announcement_headline, raw.mission_statement);
    const description = pickFirstString(raw.announcement, raw.description, raw.story);
    const title = pickFirstString(raw.title, raw.display_name, raw.shop_title);
    const location = gatherLocation(raw);
    const images = gatherImages(raw);
    const owner = gatherOwner((_c = raw.owner) !== null && _c !== void 0 ? _c : raw.user);
    const stats = gatherStats((_d = raw.stats) !== null && _d !== void 0 ? _d : raw);
    const socialLinks = gatherSocialLinks(raw);
    const policiesUrl = pickFirstString(raw.policies_url, raw.policy_url, raw.policy_link);
    const createdAt = toTimestamp((_e = raw.create_date) !== null && _e !== void 0 ? _e : raw.creation_tsz);
    const updatedAt = toTimestamp((_f = raw.update_date) !== null && _f !== void 0 ? _f : raw.last_updated_tsz);
    const languages = gatherLanguages(raw);
    const profile = {
        shop_id: shopId,
        raw,
    };
    if (shopName) {
        profile.shop_name = shopName;
    }
    if (title) {
        profile.title = title;
    }
    if (headline) {
        profile.headline = headline;
    }
    if (description) {
        profile.description = description;
    }
    if (location) {
        profile.location = location;
    }
    if (images.icon) {
        profile.icon_url = images.icon;
    }
    if (images.cover) {
        profile.cover_image_url = images.cover;
    }
    if (owner) {
        profile.owner = owner;
    }
    if (stats) {
        profile.stats = stats;
    }
    if (socialLinks) {
        profile.social_links = socialLinks;
    }
    if (policiesUrl) {
        profile.policies_url = policiesUrl;
    }
    if (createdAt !== undefined) {
        profile.created_at = createdAt;
    }
    if (updatedAt !== undefined) {
        profile.updated_at = updatedAt;
    }
    if (languages) {
        profile.languages = languages;
    }
    return profile;
}
