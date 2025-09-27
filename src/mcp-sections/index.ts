import { fetchShopSections } from "./etsySectionsClient";
import { parseSections, type ParsedSection } from "./parser";

export interface FetchSectionsParams {
  shopId: string;
}

export interface SectionsPayload {
  sections: ParsedSection[];
  raw: unknown;
}

export async function getShopSections(shopId: string): Promise<SectionsPayload> {
  if (!shopId) {
    throw new Error("Missing required parameter: shopId");
  }

  const data = await fetchShopSections(shopId);
  const sections = parseSections(data);

  return { sections, raw: data };
}

export async function fetchSections(params: FetchSectionsParams): Promise<SectionsPayload> {
  return getShopSections(params.shopId);
}

export type { ParsedSection } from "./parser";
