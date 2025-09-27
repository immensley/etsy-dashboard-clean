import fetch from "node-fetch";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36";

function buildProfileUrl(shopId: string): string {
  const trimmed = shopId.trim();
  const baseUrl = `https://www.etsy.com/api/v3/ajax/public/shops/${encodeURIComponent(trimmed)}/shop-home`;
  return baseUrl;
}

export async function fetchShopProfile(shopId: string): Promise<unknown> {
  const normalized = shopId?.trim();
  if (!normalized) {
    throw new Error("Missing required parameter: shopId");
  }

  const apiKey = process.env.ZENROWS_API_KEY;
  if (!apiKey) {
    throw new Error("ZENROWS_API_KEY environment variable is not set");
  }

  const etsyUrl = buildProfileUrl(normalized);
  const zenrowsUrl = `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent(etsyUrl)}&premium_proxy=true`;

  console.log("Shop Profile ZenRows URL:", zenrowsUrl); // DEBUG

  const response = await fetch(zenrowsUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  const text = await response.text();
  console.log("Shop Profile RAW RESPONSE (first 500 chars):", text.slice(0, 500)); // DEBUG

  try {
    return JSON.parse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error("Failed to parse shop profile JSON from ZenRows: " + message);
  }
}
