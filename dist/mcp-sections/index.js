import { fetchShopSections } from "./etsySectionsClient.js";
import { parseSections } from "./parser.js";
export async function getShopSections(shopId) {
    if (!shopId) {
        throw new Error("Missing required parameter: shopId");
    }
    const data = await fetchShopSections(shopId);
    const sections = parseSections(data);
    return { sections, raw: data };
}
export async function fetchSections(params) {
    return getShopSections(params.shopId);
}
