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
function toBoolean(value) {
    if (typeof value === "boolean") {
        return value;
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
function buildBuyer(group) {
    const summary = {};
    const userId = toNumber(group.buyer_user_id);
    if (userId !== undefined) {
        summary.user_id = userId;
    }
    const realName = toString(group.buyer_real_name);
    if (realName) {
        summary.real_name = realName;
    }
    const loginName = toString(group.buyer_login_name);
    if (loginName) {
        summary.login_name = loginName;
    }
    const avatar = toString(group.buyer_avatar_url);
    if (avatar) {
        summary.avatar_url = avatar;
    }
    return Object.keys(summary).length > 0 ? summary : undefined;
}
function buildListing(rawReview) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    const summary = {};
    const listingId = toId((_b = (_a = rawReview.listing_id) !== null && _a !== void 0 ? _a : rawReview.transaction_listing_id) !== null && _b !== void 0 ? _b : rawReview.transaction_id);
    if (listingId !== undefined) {
        summary.listing_id = listingId;
    }
    const title = toString((_c = rawReview.listing_title) !== null && _c !== void 0 ? _c : (_d = rawReview.listing) === null || _d === void 0 ? void 0 : _d.title);
    if (title) {
        summary.title = title;
    }
    const url = toString((_g = (_f = (_e = rawReview.listing) === null || _e === void 0 ? void 0 : _e.url) !== null && _f !== void 0 ? _f : rawReview.listing_url) !== null && _g !== void 0 ? _g : rawReview.url);
    if (url) {
        summary.url = url;
    }
    const image = toString((_k = (_h = rawReview.listing_image_url) !== null && _h !== void 0 ? _h : (_j = rawReview.listing) === null || _j === void 0 ? void 0 : _j.image_url) !== null && _k !== void 0 ? _k : (_l = rawReview.listing) === null || _l === void 0 ? void 0 : _l.image);
    if (image) {
        summary.image_url = image;
    }
    const priceSource = (_q = (_o = (_m = rawReview.listing) === null || _m === void 0 ? void 0 : _m.price) !== null && _o !== void 0 ? _o : (_p = rawReview.listing) === null || _p === void 0 ? void 0 : _p.price_value) !== null && _q !== void 0 ? _q : rawReview.listing_price;
    if (priceSource !== undefined) {
        summary.price = priceSource;
    }
    return Object.keys(summary).length > 0 ? summary : undefined;
}
function toTimestamp(value) {
    const numeric = toNumber(value);
    if (numeric !== undefined) {
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
function cleanText(value) {
    const text = toString(value);
    if (!text) {
        return undefined;
    }
    return text.length > 500 ? `${text.slice(0, 497)}...` : text;
}
function initAggregation() {
    return {
        totalReviews: 0,
        ratingSum: 0,
        distribution: new Map(),
        languageCounts: new Map(),
        responses: { withResponse: 0, total: 0 },
        highlights: [],
    };
}
function recordLanguage(state, rawReview) {
    var _a, _b, _c;
    const language = (_b = (_a = toString(rawReview.language)) !== null && _a !== void 0 ? _a : toString(rawReview.review_language)) !== null && _b !== void 0 ? _b : toString(rawReview.buyer_language);
    if (!language) {
        return;
    }
    const current = (_c = state.languageCounts.get(language)) !== null && _c !== void 0 ? _c : 0;
    state.languageCounts.set(language, current + 1);
}
function recordRating(state, ratingValue) {
    var _a;
    if (ratingValue === undefined) {
        return;
    }
    state.ratingSum += ratingValue;
    const bucket = Math.round(ratingValue);
    if (!Number.isNaN(bucket)) {
        const current = (_a = state.distribution.get(bucket)) !== null && _a !== void 0 ? _a : 0;
        state.distribution.set(bucket, current + 1);
    }
}
function recordResponse(state, response, removed) {
    state.responses.total += 1;
    if (response && !removed) {
        state.responses.withResponse += 1;
    }
}
function buildHighlight(rawReview, buyer, listing) {
    var _a, _b, _c, _d;
    const transactionId = toId((_a = rawReview.transaction_id) !== null && _a !== void 0 ? _a : rawReview.listing_id);
    if (transactionId === undefined) {
        return undefined;
    }
    const rating = toNumber(rawReview.rating);
    const review = cleanText(rawReview.review);
    const reviewTranslated = cleanText((_b = rawReview.review_translated) !== null && _b !== void 0 ? _b : rawReview.review_translation);
    const response = cleanText(rawReview.response);
    const responseRemoved = toBoolean(rawReview.response_removed);
    const language = toString(rawReview.language);
    const updateDate = toTimestamp((_d = (_c = rawReview.update_date) !== null && _c !== void 0 ? _c : rawReview.created_timestamp) !== null && _d !== void 0 ? _d : rawReview.creation_tsz);
    const highlight = {
        transaction_id: transactionId,
    };
    if (rating !== undefined) {
        highlight.rating = rating;
    }
    if (review) {
        highlight.review = review;
    }
    if (reviewTranslated) {
        highlight.review_translated = reviewTranslated;
    }
    if (response) {
        highlight.response = response;
    }
    if (responseRemoved !== undefined) {
        highlight.response_removed = responseRemoved;
    }
    if (language) {
        highlight.language = language;
    }
    if (updateDate !== undefined) {
        highlight.update_date = updateDate;
    }
    if (buyer) {
        highlight.buyer = buyer;
    }
    if (listing) {
        highlight.listing = listing;
    }
    return highlight;
}
function processReview(state, rawReview, buyer) {
    const listing = buildListing(rawReview);
    const highlight = buildHighlight(rawReview, buyer, listing);
    if (!highlight) {
        return;
    }
    const rating = highlight.rating;
    recordRating(state, rating);
    recordLanguage(state, rawReview);
    recordResponse(state, highlight.response, highlight.response_removed);
    state.totalReviews += 1;
    state.highlights.push(highlight);
}
function processReviewGroup(state, group) {
    const buyer = buildBuyer(group);
    const reviews = group.reviews;
    if (!Array.isArray(reviews)) {
        return;
    }
    for (const rawReview of reviews) {
        if (rawReview && typeof rawReview === "object") {
            processReview(state, rawReview, buyer);
        }
    }
}
export function parseReviewInsights(data) {
    var _a, _b, _c;
    const state = initAggregation();
    if (Array.isArray(data)) {
        for (const group of data) {
            if (group && typeof group === "object") {
                processReviewGroup(state, group);
            }
        }
    }
    else if (data && typeof data === "object") {
        const record = data;
        const reviewsContainer = (_b = (_a = record.reviews) !== null && _a !== void 0 ? _a : record.groups) !== null && _b !== void 0 ? _b : record.results;
        if (Array.isArray(reviewsContainer)) {
            for (const group of reviewsContainer) {
                if (group && typeof group === "object") {
                    processReviewGroup(state, group);
                }
            }
        }
    }
    state.highlights.sort((a, b) => { var _a, _b; return ((_a = b.update_date) !== null && _a !== void 0 ? _a : 0) - ((_b = a.update_date) !== null && _b !== void 0 ? _b : 0); });
    const highlights = state.highlights.slice(0, 10);
    const ratingDistribution = [];
    const total = state.totalReviews || 1;
    for (let rating = 5; rating >= 1; rating -= 1) {
        const count = (_c = state.distribution.get(rating)) !== null && _c !== void 0 ? _c : 0;
        const percentage = total === 0 ? 0 : (count / total) * 100;
        ratingDistribution.push({ rating, count, percentage });
    }
    const languageCounts = Array.from(state.languageCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([language, count]) => ({ language, count }));
    const averageRating = state.totalReviews > 0 ? state.ratingSum / state.totalReviews : undefined;
    const responseRate = state.responses.total > 0 ? state.responses.withResponse / state.responses.total : undefined;
    return {
        total_reviews: state.totalReviews,
        average_rating: averageRating,
        rating_distribution: ratingDistribution,
        language_counts: languageCounts,
        response_rate: responseRate,
        highlights,
    };
}
