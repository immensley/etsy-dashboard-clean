import { fetchShopAnnouncements } from "./etsyShopAnnouncementsClient.js";
import { parseAnnouncement, type ShopAnnouncementSummary } from "./parser.js";

export interface ShopAnnouncementPayload {
  announcement: ShopAnnouncementSummary | null;
  raw: unknown;
}

export async function getShopAnnouncement(shopId: string): Promise<ShopAnnouncementPayload> {
  if (!shopId || shopId.trim().length === 0) {
    throw new Error("Missing required parameter: shopId");
  }

  const raw = await fetchShopAnnouncements(shopId.trim());
  const announcement = parseAnnouncement(raw);

  return { announcement, raw };
}

export async function fetchAnnouncement({ shop_id }: { shop_id: string }): Promise<ShopAnnouncementPayload> {
  return getShopAnnouncement(shop_id);
}

export { type ShopAnnouncementSummary, type PolicySummary, type AnnouncementHighlight } from "./parser.js";
