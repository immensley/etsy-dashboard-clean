import { fetchShopListings as fetchRawShopListings } from "./etsyClient.js";
import { fetchListing } from "./listingClient.js";
import { parseListings, type ParsedListing } from "./parser.js";

type MaybeNumber = number | string | undefined;

export interface FetchShopParams {
  shopId: string;
  sectionId?: string;
  limit?: MaybeNumber;
  offset?: MaybeNumber;
}

export type ShopListing = ParsedListing;

export interface ShopListingsPayload {
  listings: ShopListing[];
}

const DEFAULT_LIMIT = 5;

function normalizeLimit(value: MaybeNumber): number {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_LIMIT;
  }

  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? DEFAULT_LIMIT : parsed;
}

function hasStringValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function mergeListings(base: ParsedListing, detail: ParsedListing | null): ParsedListing {
  if (!detail) {
    return base;
  }

  const merged: ParsedListing = { ...base };

  const basePriceString = typeof base.price === "string" ? base.price.trim() : null;
  const hasBasePrice =
    typeof base.price === "number" || (basePriceString !== null && basePriceString.length > 0);

  if (!hasBasePrice) {
    merged.price = detail.price ?? base.price;
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

  merged.in_carts = detail.in_carts ?? base.in_carts;
  merged.favorites = detail.favorites ?? base.favorites;
  merged.views = detail.views ?? base.views;

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

export async function fetchShopListings({
  shopId,
  sectionId,
  limit,
}: FetchShopParams): Promise<ShopListingsPayload> {
  if (!shopId) {
    throw new Error("Missing required parameter: shop_id");
  }

  const normalizedLimit = normalizeLimit(limit);
  const data = await fetchRawShopListings(shopId, sectionId, normalizedLimit);
  const listings = parseListings(data);

  const detailResults = await Promise.all(
    listings.map(async (listing) => {
      const id = listing.listing_id;
      if (!id && id !== 0) {
        return null;
      }

      try {
        return await fetchListing(id);
      } catch (error) {
        console.warn("Failed to fetch listing detail", id, error);
        return null;
      }
    }),
  );

  const enriched = listings.map((listing, index) => mergeListings(listing, detailResults[index]));

  return { listings: enriched };
}
