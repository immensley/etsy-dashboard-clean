import { fetchShopListings } from "./shopClient";
import { fetchListing } from "./listingClient";

export async function getShopData(shopId: string, sectionId?: string, limit?: number, offset?: number) {
  return fetchShopListings({ shopId, sectionId, limit, offset });
}

export async function getListingData(listingId: string | number) {
  return fetchListing(listingId);
}

export async function fetchShop({
  shop_id,
  section_id,
  limit,
  offset,
}: {
  shop_id: string;
  section_id?: string;
  limit?: number;
  offset?: number;
}) {
  return getShopData(shop_id, section_id, limit, offset);
}

export async function getListing({
  listing_id,
}: {
  listing_id: string;
}) {
  return getListingData(listing_id);
}

// Backwards-compatible alias used by some runners expecting camel-case command names.
export const fetchListingCommand = getListing;
