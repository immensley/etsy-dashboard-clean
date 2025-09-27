import { fetchListingInventory } from "./etsyInventoryClient.js";
import { parseInventory, type InventorySummary } from "./parser.js";

export interface InventoryPayload {
  inventory: InventorySummary | null;
  raw: unknown;
}

export async function getInventoryVariants(listingId: string | number): Promise<InventoryPayload> {
  if (listingId === null || listingId === undefined || `${listingId}`.trim().length === 0) {
    throw new Error("Missing required parameter: listingId");
  }

  const raw = await fetchListingInventory(listingId);
  const inventory = parseInventory(raw);

  return { inventory, raw };
}

export async function fetchInventory({ listing_id }: { listing_id: string | number }): Promise<InventoryPayload> {
  return getInventoryVariants(listing_id);
}

export { type InventorySummary, type InventoryVariant, type VariantOffering, type VariantOption } from "./parser.js";
