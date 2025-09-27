import { fetchListingInventory } from "./etsyInventoryClient.js";
import { parseInventory } from "./parser.js";
export async function getInventoryVariants(listingId) {
    if (listingId === null || listingId === undefined || `${listingId}`.trim().length === 0) {
        throw new Error("Missing required parameter: listingId");
    }
    const raw = await fetchListingInventory(listingId);
    const inventory = parseInventory(raw);
    return { inventory, raw };
}
export async function fetchInventory({ listing_id }) {
    return getInventoryVariants(listing_id);
}
