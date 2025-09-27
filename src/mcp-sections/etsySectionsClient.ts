import fetch from "node-fetch";

export async function fetchShopSections(shopId: string): Promise<unknown> {
  if (!shopId) {
    throw new Error("Missing required parameter: shopId");
  }

  const apiKey = process.env.ZENROWS_API_KEY;
  if (!apiKey) {
    throw new Error("ZENROWS_API_KEY environment variable is not set");
  }

  const baseUrl = `https://www.etsy.com/api/v3/ajax/public/shops/${shopId}/sections`;
  const zenrowsUrl = `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent(baseUrl)}&premium_proxy=true`;

  console.log("Sections ZenRows URL:", zenrowsUrl); // DEBUG

  const response = await fetch(zenrowsUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
    },
  });

  const text = await response.text();
  console.log("Sections RAW RESPONSE (first 500 chars):", text.slice(0, 500)); // DEBUG

  try {
    return JSON.parse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error("Failed to parse sections JSON from ZenRows: " + message);
  }
}
