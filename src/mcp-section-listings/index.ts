import { fetchSectionListings, type FetchSectionListingsParams } from "./etsySectionListingsClient.js";
import { parseSectionListings, type ParsedSectionListing } from "./parser.js";

export type GetSectionListingsParams = FetchSectionListingsParams;

export interface SectionListingsPayload {
  listings: ParsedSectionListing[];
  raw: unknown;
}

export async function getSectionListings(params: GetSectionListingsParams): Promise<SectionListingsPayload> {
  const raw = await fetchSectionListings(params);
  const listings = parseSectionListings(raw);
  return { listings, raw };
}

export async function fetchListings(params: GetSectionListingsParams): Promise<SectionListingsPayload> {
  return getSectionListings(params);
}

export type { ParsedSectionListing, ListingMediaSummary, ShopSummary } from "./parser.js";
