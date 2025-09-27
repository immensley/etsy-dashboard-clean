type Primitive = string | number | boolean;

type RawRecord = Record<string, unknown>;

type MaybeNumber = number | string | null | undefined;

type MaybeString = string | null | undefined;

export interface BuyerSummary {
  user_id?: number;
  real_name?: string;
  login_name?: string;
  avatar_url?: string;
}

export interface ListingSummary {
  listing_id?: string | number;
  title?: string;
  url?: string;
  image_url?: string;
  price?: Primitive | Record<string, unknown>;
}

export interface ReviewHighlight {
  transaction_id: string | number;
  rating?: number;
  review?: string;
  review_translated?: string;
  response?: string;
  response_removed?: boolean;
  language?: string;
  update_date?: number;
  buyer?: BuyerSummary;
  listing?: ListingSummary;
}

export interface RatingBucket {
  rating: number;
  count: number;
  percentage: number;
}

export interface LanguageBucket {
  language: string;
  count: number;
}

export interface ReviewInsights {
  total_reviews: number;
  average_rating?: number;
  rating_distribution: RatingBucket[];
  language_counts: LanguageBucket[];
  response_rate?: number;
  highlights: ReviewHighlight[];
}

function toNumber(value: MaybeNumber): number | undefined {
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

function toString(value: MaybeString): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
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

function toId(value: unknown): string | number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}

function buildBuyer(group: RawRecord): BuyerSummary | undefined {
  const summary: BuyerSummary = {};

  const userId = toNumber(group.buyer_user_id as MaybeNumber);
  if (userId !== undefined) {
    summary.user_id = userId;
  }

  const realName = toString(group.buyer_real_name as MaybeString);
  if (realName) {
    summary.real_name = realName;
  }

  const loginName = toString(group.buyer_login_name as MaybeString);
  if (loginName) {
    summary.login_name = loginName;
  }

  const avatar = toString(group.buyer_avatar_url as MaybeString);
  if (avatar) {
    summary.avatar_url = avatar;
  }

  return Object.keys(summary).length > 0 ? summary : undefined;
}

function buildListing(rawReview: RawRecord): ListingSummary | undefined {
  const summary: ListingSummary = {};

  const listingId = toId(rawReview.listing_id ?? rawReview.transaction_listing_id ?? rawReview.transaction_id);
  if (listingId !== undefined) {
    summary.listing_id = listingId;
  }

  const title = toString(rawReview.listing_title as MaybeString ?? (rawReview.listing as RawRecord | undefined)?.title as MaybeString);
  if (title) {
    summary.title = title;
  }

  const url = toString(
    (rawReview.listing as RawRecord | undefined)?.url as MaybeString ??
      rawReview.listing_url as MaybeString ??
      rawReview.url as MaybeString,
  );
  if (url) {
    summary.url = url;
  }

  const image = toString(
    rawReview.listing_image_url as MaybeString ??
      (rawReview.listing as RawRecord | undefined)?.image_url as MaybeString ??
      (rawReview.listing as RawRecord | undefined)?.image as MaybeString,
  );
  if (image) {
    summary.image_url = image;
  }

  const priceSource =
    (rawReview.listing as RawRecord | undefined)?.price ??
    (rawReview.listing as RawRecord | undefined)?.price_value ??
    rawReview.listing_price;
  if (priceSource !== undefined) {
    summary.price = priceSource as Primitive | Record<string, unknown>;
  }

  return Object.keys(summary).length > 0 ? summary : undefined;
}

function toTimestamp(value: unknown): number | undefined {
  const numeric = toNumber(value as MaybeNumber);
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

function cleanText(value: unknown): string | undefined {
  const text = toString(value as MaybeString);
  if (!text) {
    return undefined;
  }
  return text.length > 500 ? `${text.slice(0, 497)}...` : text;
}

interface AggregationState {
  totalReviews: number;
  ratingSum: number;
  distribution: Map<number, number>;
  languageCounts: Map<string, number>;
  responses: { withResponse: number; total: number };
  highlights: ReviewHighlight[];
}

function initAggregation(): AggregationState {
  return {
    totalReviews: 0,
    ratingSum: 0,
    distribution: new Map<number, number>(),
    languageCounts: new Map<string, number>(),
    responses: { withResponse: 0, total: 0 },
    highlights: [],
  };
}

function recordLanguage(state: AggregationState, rawReview: RawRecord): void {
  const language =
    toString(rawReview.language as MaybeString) ??
    toString(rawReview.review_language as MaybeString) ??
    toString(rawReview.buyer_language as MaybeString);
  if (!language) {
    return;
  }
  const current = state.languageCounts.get(language) ?? 0;
  state.languageCounts.set(language, current + 1);
}

function recordRating(state: AggregationState, ratingValue: number | undefined): void {
  if (ratingValue === undefined) {
    return;
  }
  state.ratingSum += ratingValue;
  const bucket = Math.round(ratingValue);
  if (!Number.isNaN(bucket)) {
    const current = state.distribution.get(bucket) ?? 0;
    state.distribution.set(bucket, current + 1);
  }
}

function recordResponse(state: AggregationState, response?: string, removed?: boolean): void {
  state.responses.total += 1;
  if (response && !removed) {
    state.responses.withResponse += 1;
  }
}

function buildHighlight(rawReview: RawRecord, buyer: BuyerSummary | undefined, listing: ListingSummary | undefined): ReviewHighlight | undefined {
  const transactionId = toId(rawReview.transaction_id ?? rawReview.listing_id);
  if (transactionId === undefined) {
    return undefined;
  }

  const rating = toNumber(rawReview.rating as MaybeNumber);
  const review = cleanText(rawReview.review);
  const reviewTranslated = cleanText(rawReview.review_translated ?? rawReview.review_translation);
  const response = cleanText(rawReview.response);
  const responseRemoved = toBoolean(rawReview.response_removed);
  const language = toString(rawReview.language as MaybeString);
  const updateDate = toTimestamp(rawReview.update_date ?? rawReview.created_timestamp ?? rawReview.creation_tsz);

  const highlight: ReviewHighlight = {
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

function processReview(state: AggregationState, rawReview: RawRecord, buyer: BuyerSummary | undefined): void {
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

function processReviewGroup(state: AggregationState, group: RawRecord): void {
  const buyer = buildBuyer(group);
  const reviews = group.reviews;
  if (!Array.isArray(reviews)) {
    return;
  }
  for (const rawReview of reviews) {
    if (rawReview && typeof rawReview === "object") {
      processReview(state, rawReview as RawRecord, buyer);
    }
  }
}

export function parseReviewInsights(data: unknown): ReviewInsights {
  const state = initAggregation();

  if (Array.isArray(data)) {
    for (const group of data) {
      if (group && typeof group === "object") {
        processReviewGroup(state, group as RawRecord);
      }
    }
  } else if (data && typeof data === "object") {
    const record = data as RawRecord;
    const reviewsContainer = record.reviews ?? record.groups ?? record.results;
    if (Array.isArray(reviewsContainer)) {
      for (const group of reviewsContainer) {
        if (group && typeof group === "object") {
          processReviewGroup(state, group as RawRecord);
        }
      }
    }
  }

  state.highlights.sort((a, b) => (b.update_date ?? 0) - (a.update_date ?? 0));
  const highlights = state.highlights.slice(0, 10);

  const ratingDistribution: RatingBucket[] = [];
  const total = state.totalReviews || 1;
  for (let rating = 5; rating >= 1; rating -= 1) {
    const count = state.distribution.get(rating) ?? 0;
    const percentage = total === 0 ? 0 : (count / total) * 100;
    ratingDistribution.push({ rating, count, percentage });
  }

  const languageCounts: LanguageBucket[] = Array.from(state.languageCounts.entries())
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
