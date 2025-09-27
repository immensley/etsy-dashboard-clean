import fetch from "node-fetch";

export interface FetchSectionListingsParams {
  shopId: string;
  sectionId?: string;
  limit?: number;
  offset?: number;
}

const DEFAULT_LIMIT = 5;
const DEFAULT_OFFSET = 0;

function buildUrl({ shopId, sectionId, limit, offset }: FetchSectionListingsParams): string {
  const finalLimit = typeof limit === "number" && Number.isFinite(limit) ? limit : DEFAULT_LIMIT;
  const finalOffset = typeof offset === "number" && Number.isFinite(offset) ? offset : DEFAULT_OFFSET;
  const finalSection = sectionId ?? "";

  const url = new URL(`https://www.etsy.com/api/v3/ajax/public/shops/${shopId}/listings`);
  url.searchParams.set("limit", String(finalLimit));
  url.searchParams.set("offset", String(finalOffset));
  if (finalSection) {
    url.searchParams.set("shop_section_id", finalSection);
  }

  return url.toString();
}

export async function fetchSectionListings(params: FetchSectionListingsParams): Promise<unknown> {
  if (!params.shopId) {
    throw new Error("Missing required parameter: shopId");
  }

  const apiKey = process.env.ZENROWS_API_KEY;
  if (!apiKey) {
    throw new Error("ZENROWS_API_KEY environment variable is not set");
  }

  const baseUrl = buildUrl(params);
  const zenrowsUrl = `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent(baseUrl)}&premium_proxy=true`;

  console.log("Section Listings ZenRows URL:", zenrowsUrl); // DEBUG

  const response = await fetch(zenrowsUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
    },
  });

  const text = await response.text();
  console.log("Section Listings RAW RESPONSE (first 500 chars):", text.slice(0, 500)); // DEBUG

  try {
    return JSON.parse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error("Failed to parse section listings JSON from ZenRows: " + message);
  }
}
