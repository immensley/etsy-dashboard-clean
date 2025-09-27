function cleanString(value) {
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
function toId(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
        return value;
    }
    return "";
}
function buildBuyer(group) {
    const info = {};
    const userId = toNumber(group.buyer_user_id);
    if (userId !== undefined) {
        info.user_id = userId;
    }
    const realName = cleanString(group.buyer_real_name);
    if (realName) {
        info.real_name = realName;
    }
    const loginName = cleanString(group.buyer_login_name);
    if (loginName) {
        info.login_name = loginName;
    }
    const avatarUrl = cleanString(group.buyer_avatar_url);
    if (avatarUrl) {
        info.avatar_url = avatarUrl;
    }
    const isAnonymous = toBoolean(group.buyer_is_anonymous);
    if (isAnonymous !== undefined) {
        info.is_anonymous = isAnonymous;
    }
    const isActive = toBoolean(group.buyer_is_active);
    if (isActive !== undefined) {
        info.is_active = isActive;
    }
    const isGuest = toBoolean(group.buyer_is_guest);
    if (isGuest !== undefined) {
        info.is_guest = isGuest;
    }
    const isNameWithheld = toBoolean(group.buyer_is_name_withheld);
    if (isNameWithheld !== undefined) {
        info.is_name_withheld = isNameWithheld;
    }
    return Object.keys(info).length > 0 ? info : undefined;
}
function buildListing(review) {
    var _a, _b, _c;
    const listingId = toNumber((_a = review.listing_id) !== null && _a !== void 0 ? _a : review.transaction_id);
    const title = cleanString(review.listing_title);
    const imageUrl = cleanString(review.listing_image_url);
    let url;
    const listing = review.listing;
    if (listing) {
        url = cleanString(listing.url);
    }
    const priceRaw = (_c = (_b = listing === null || listing === void 0 ? void 0 : listing.price) !== null && _b !== void 0 ? _b : listing === null || listing === void 0 ? void 0 : listing.price_value) !== null && _c !== void 0 ? _c : review.listing_price;
    let price;
    if (priceRaw && (typeof priceRaw === "object" || typeof priceRaw === "string" || typeof priceRaw === "number" || typeof priceRaw === "boolean")) {
        price = priceRaw;
    }
    const summary = {};
    if (listingId !== undefined) {
        summary.listing_id = listingId;
    }
    if (title) {
        summary.title = title;
    }
    if (imageUrl) {
        summary.image_url = imageUrl;
    }
    if (url) {
        summary.url = url;
    }
    if (price !== undefined) {
        summary.price = price;
    }
    return Object.keys(summary).length > 0 ? summary : undefined;
}
function buildReviewEntry(review) {
    var _a, _b, _c;
    const transactionId = toId((_a = review.transaction_id) !== null && _a !== void 0 ? _a : review.listing_id);
    if (transactionId === "") {
        return undefined;
    }
    const entry = {
        transaction_id: transactionId,
        raw_review: review,
    };
    const listing = buildListing(review);
    if (listing) {
        entry.listing = listing;
    }
    const rating = toNumber(review.rating);
    if (rating !== undefined) {
        entry.rating = rating;
    }
    const reviewText = cleanString((_b = review.review) !== null && _b !== void 0 ? _b : review.review_message);
    if (reviewText) {
        entry.review = reviewText;
    }
    const reviewTranslated = cleanString(review.review_translated);
    if (reviewTranslated) {
        entry.review_translated = reviewTranslated;
    }
    const response = cleanString(review.response);
    if (response) {
        entry.response = response;
    }
    const responseRemoved = toBoolean(review.is_response_deleted);
    if (responseRemoved !== undefined) {
        entry.response_removed = responseRemoved;
    }
    const language = cleanString((_c = review.language) !== null && _c !== void 0 ? _c : review.review_language);
    if (language) {
        entry.language = language;
    }
    const updateDate = toNumber(review.update_date);
    if (updateDate !== undefined) {
        entry.update_date = updateDate;
    }
    const buyerLeftFeedback = toBoolean(review.buyer_left_feedback);
    if (buyerLeftFeedback !== undefined) {
        entry.buyer_left_feedback = buyerLeftFeedback;
    }
    const sellerLeftFeedback = toBoolean(review.seller_left_feedback);
    if (sellerLeftFeedback !== undefined) {
        entry.seller_left_feedback = sellerLeftFeedback;
    }
    return entry;
}
function buildReviewGroup(group) {
    const receiptId = toId(group.receipt_id);
    if (receiptId === "") {
        return undefined;
    }
    const date = toNumber(group.date);
    const buyer = buildBuyer(group);
    const rawReviews = Array.isArray(group.reviews) ? group.reviews : [];
    const reviews = rawReviews
        .map((review) => buildReviewEntry(review))
        .filter((entry) => Boolean(entry));
    return {
        receipt_id: receiptId,
        date,
        buyer,
        reviews,
        raw_group: group,
    };
}
export function parseReviews(data) {
    if (!data || typeof data !== "object") {
        return [];
    }
    const response = data;
    const groups = Array.isArray(response.reviews) ? response.reviews : [];
    return groups
        .map((group) => buildReviewGroup(group))
        .filter((group) => Boolean(group));
}
