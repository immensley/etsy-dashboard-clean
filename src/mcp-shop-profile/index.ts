import { fetchShopProfile } from "./etsyShopProfileClient.js";
import { parseShopProfile, type ShopProfile } from "./parser.js";

export interface ShopProfilePayload {
  profile: ShopProfile | null;
  raw: unknown;
}

export async function getShopProfile(shopId: string): Promise<ShopProfilePayload> {
  if (!shopId || shopId.trim().length === 0) {
    throw new Error("Missing required parameter: shopId");
  }

  const raw = await fetchShopProfile(shopId);
  const profile = parseShopProfile(raw);

  return { profile, raw };
}

export async function fetchProfile({ shop_id }: { shop_id: string }): Promise<ShopProfilePayload> {
  return getShopProfile(shop_id);
}

export { type ShopProfile } from "./parser.js";
