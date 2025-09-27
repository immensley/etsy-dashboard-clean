import { fetchSectionListings } from "./etsySectionListingsClient.js";
import { parseSectionListings } from "./parser.js";
export async function getSectionListings(params) {
    const raw = await fetchSectionListings(params);
    const listings = parseSectionListings(raw);
    return { listings, raw };
}
export async function fetchListings(params) {
    return getSectionListings(params);
}
