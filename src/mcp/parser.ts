interface RawImage {
  url_fullxfull?: string | null;
  url?: string | null;
  url_570xN?: string | null;
}

interface RawShop {
  store_name?: string | null;
}

interface RawListing {
  listing_id?: string | number;
  title?: string;
  price?: string | number;
  currency_code?: string;
  state?: string | number;
  shop_name?: string | null;
  shop_url?: string | null;
  url?: string | null;
  description?: string | null;
  tags?: unknown;
  materials?: unknown;
  views?: number | string;
  Shop?: RawShop | null;
  in_cart_count?: number | string;
  in_carts?: number | string;
  cart_count?: number | string;
  num_favorers?: number | string;
  favorites?: number | string;
  favorite_count?: number | string;
  images?: (RawImage | string)[] | null;
  listing_images?: (RawImage | string)[] | null;
  image?: string | null;
  money_price?: unknown;
  price_usd?: unknown;
  price_obj?: unknown;
  [key: string]: unknown;
}

interface RawResponse {
  results?: RawListing[] | null;
}

export interface ParsedListing {
  listing_id: string | number;
  title: string;
  price: string | number;
  currency: string;
  state: string;
  in_carts: number;
  favorites: number;
  views: number;
  images?: string[];
  shop_name?: string;
  shop_url?: string;
  url?: string;
  description?: string;
  tags?: string[];
  materials?: string[];
  price_details?: Record<string, unknown>;
  raw_list?: RawListing;
  raw_detail?: RawListing;
}

function toNumber(value: unknown): number {
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

function filterStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function normalizeState(value: unknown): string {
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

function extractImageUrl(item: RawListing | null | undefined): string | null {
  if (!item) {
    return null;
  }

  const directImage = item.image;
  if (typeof directImage === "string" && directImage.trim().length > 0) {
    return directImage;
  }

  const images = item.images ?? item.listing_images;
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

      const record = image as RawImage;
      const full = record.url_fullxfull ?? record.url ?? record.url_570xN;
      if (typeof full === "string" && full.trim().length > 0) {
        return full;
      }
    }
  }

  return null;
}

function buildPriceDetails(item: RawListing | null | undefined): Record<string, unknown> | null {
  if (!item) {
    return null;
  }

  const details: Record<string, unknown> = {};

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

function resolvePrice(value: unknown): string | number {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  if (value && typeof value === "object") {
    const amount = (value as { amount?: number | string }).amount;
    if (amount !== undefined) {
      return amount;
    }
  }

  return "";
}

function resolveFavorites(item: RawListing | null | undefined): number {
  if (!item) {
    return 0;
  }

  const candidate =
    item.num_favorers ??
    item.favorites ??
    item.favorite_count ??
    (item as Record<string, unknown>).num_favorited;

  return toNumber(candidate);
}

function resolveInCarts(item: RawListing | null | undefined): number {
  if (!item) {
    return 0;
  }

  const candidate = item.in_cart_count ?? item.in_carts ?? item.cart_count;
  return toNumber(candidate);
}

function toParsedListing(item: RawListing | null | undefined, source: "list" | "detail" = "list"): ParsedListing {
  const listingId = item?.listing_id ?? "";
  const title = item?.title ?? "";
  const price = resolvePrice(item?.price);
  const currency = item?.currency_code ?? "";
  const state = normalizeState(item?.state);
  const shopName = item?.shop_name ?? item?.Shop?.store_name ?? null;
  const shopUrl = typeof item?.shop_url === "string" ? item.shop_url : null;
  const url = typeof item?.url === "string" ? item.url : null;
  const inCarts = resolveInCarts(item);
  const favorites = resolveFavorites(item);
  const views = toNumber(item?.views);
  const description = typeof item?.description === "string" ? item.description.trim() : "";
  const tags = filterStrings(item?.tags);
  const materials = filterStrings(item?.materials);
  const priceDetails = buildPriceDetails(item);
  const imageUrl = extractImageUrl(item);
  const rawList = source === "list" ? item ?? null : null;
  const rawDetail = source === "detail" ? item ?? null : null;

  const result: ParsedListing = {
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

export function parseListings(data: unknown): ParsedListing[] {
  if (Array.isArray(data)) {
    return data.map((item) =>
      toParsedListing(item && typeof item === "object" ? (item as RawListing) : undefined, "list"),
    );
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const response = data as RawResponse;
  if (!response.results || !Array.isArray(response.results)) {
    return [];
  }

  return response.results.map((item) => toParsedListing(item, "list"));
}

export type ListingDetails = ParsedListing;

export function parseSingleListing(data: unknown): ListingDetails | null {
  if (data && typeof data === "object") {
    if ("listing_id" in data) {
      return toParsedListing(data as RawListing, "detail");
    }

    const response = data as RawResponse;
    if (response.results && Array.isArray(response.results) && response.results.length > 0) {
      return toParsedListing(response.results[0], "detail");
    }
  }

  const [first] = parseListings(data);
  return first ?? null;
}
