type Primitive = string | number | boolean;

type RawReview = Record<string, unknown>;

type RawReviewGroup = Record<string, unknown> & {
  reviews?: RawReview[];
};

type RawResponse = {
  reviews?: RawReviewGroup[];
  count?: number;
  [key: string]: unknown;
};

export interface BuyerInfo {
  user_id?: number;
  real_name?: string;
  login_name?: string;
  avatar_url?: string;
  is_anonymous?: boolean;
  is_active?: boolean;
  is_guest?: boolean;
  is_name_withheld?: boolean;
}

export interface ListingSummary {
  listing_id?: string | number;
  title?: string;
  image_url?: string;
  url?: string;
  price?: Primitive | Record<string, unknown>;
}

export interface ParsedReviewEntry {
  transaction_id: string | number;
  listing?: ListingSummary;
  rating?: number;
  review?: string;
  review_translated?: string;
  response?: string;
  response_removed?: boolean;
  language?: string;
  update_date?: number;
  buyer_left_feedback?: boolean;
  seller_left_feedback?: boolean;
  raw_review: RawReview;
}

export interface ParsedReviewGroup {
  receipt_id: string | number;
  date?: number;
  buyer?: BuyerInfo;
  reviews: ParsedReviewEntry[];
  raw_group: RawReviewGroup;
}

function cleanString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return undefined;
}

function toNumber(value: unknown): number | undefined {
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

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  return undefined;
}

function toId(value: unknown): string | number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return "";
}

function buildBuyer(group: RawReviewGroup): BuyerInfo | undefined {
  const info: BuyerInfo = {};

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

function buildListing(review: RawReview): ListingSummary | undefined {
  const listingId = toNumber(review.listing_id ?? review.transaction_id);
  const title = cleanString(review.listing_title);
  const imageUrl = cleanString(review.listing_image_url);

  let url: string | undefined;
  const listing = review.listing as Record<string, unknown> | undefined;
  if (listing) {
    url = cleanString(listing.url);
  }

  const priceRaw = listing?.price ?? listing?.price_value ?? review.listing_price;
  let price: Primitive | Record<string, unknown> | undefined;
  if (priceRaw && (typeof priceRaw === "object" || typeof priceRaw === "string" || typeof priceRaw === "number" || typeof priceRaw === "boolean")) {
    price = priceRaw as Primitive | Record<string, unknown>;
  }

  const summary: ListingSummary = {};

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

function buildReviewEntry(review: RawReview): ParsedReviewEntry | undefined {
  const transactionId = toId(review.transaction_id ?? review.listing_id);
  if (transactionId === "") {
    return undefined;
  }

  const entry: ParsedReviewEntry = {
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

  const reviewText = cleanString(review.review ?? review.review_message);
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

  const language = cleanString(review.language ?? review.review_language);
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

function buildReviewGroup(group: RawReviewGroup): ParsedReviewGroup | undefined {
  const receiptId = toId(group.receipt_id);
  if (receiptId === "") {
    return undefined;
  }

  const date = toNumber(group.date);
  const buyer = buildBuyer(group);

  const rawReviews = Array.isArray(group.reviews) ? group.reviews : [];
  const reviews = rawReviews
    .map((review) => buildReviewEntry(review))
    .filter((entry): entry is ParsedReviewEntry => Boolean(entry));

  return {
    receipt_id: receiptId,
    date,
    buyer,
    reviews,
    raw_group: group,
  };
}

export function parseReviews(data: unknown): ParsedReviewGroup[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const response = data as RawResponse;
  const groups = Array.isArray(response.reviews) ? response.reviews : [];

  return groups
    .map((group) => buildReviewGroup(group))
    .filter((group): group is ParsedReviewGroup => Boolean(group));
}
