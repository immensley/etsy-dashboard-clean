import fetch from "node-fetch";

export async function fetchShopListings(
  shop_id: string,
  section_id?: string,
  limit = 5,
): Promise<unknown> {
  if (!process.env.ZENROWS_API_KEY) {
    throw new Error("ZENROWS_API_KEY environment variable is not set");
  }

  const baseEtsyUrl = `https://www.etsy.com/api/v3/ajax/public/shops/${shop_id}/listings?limit=${limit}&offset=0&shop_section_id=${section_id}`;

  const zenrowsUrl = `https://api.zenrows.com/v1/?apikey=${process.env.ZENROWS_API_KEY}&url=${encodeURIComponent(
    baseEtsyUrl
  )}&premium_proxy=true`;

  console.log("Final ZenRows URL:", zenrowsUrl); // DEBUG

  const response = await fetch(zenrowsUrl, {
    headers: {
      "Accept": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
    },
  });

  const text = await response.text();
  console.log("RAW RESPONSE (first 500 chars):", text.slice(0, 500)); // DEBUG

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error("Failed to parse JSON from ZenRows: " + message);
  }

  return data;
}
