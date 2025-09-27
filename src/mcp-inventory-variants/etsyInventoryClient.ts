import fetch, { type Response } from "node-fetch";

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";

function buildListingUrl(listingId: string): string {
  const params = new URLSearchParams({
    include: "inventory,variations,production_partners,offerings,price,quantity,shipping_profiles",
  });
  return `https://www.etsy.com/api/v3/ajax/public/listings/${listingId}?${params.toString()}`;
}

export async function fetchListingInventory(listingIdInput: string | number): Promise<unknown> {
  if (listingIdInput === null || listingIdInput === undefined) {
    throw new Error("Missing required parameter: listing_id");
  }

  const listingId = `${listingIdInput}`.trim();
  if (listingId.length === 0) {
    throw new Error("Missing required parameter: listing_id");
  }

  const apiKey = process.env.ZENROWS_API_KEY;
  if (!apiKey) {
    throw new Error("ZENROWS_API_KEY is not set. Please add it to your environment or .env.local file.");
  }

  const etsyUrl = buildListingUrl(listingId);
  const zenrowsUrl = `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent(etsyUrl)}&premium_proxy=true`;

  console.log("Inventory ZenRows URL:", zenrowsUrl); // DEBUG

  let response: Response;
  try {
    response = await fetch(zenrowsUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
    });
  } catch {
    throw new Error("Failed to reach ZenRows: request aborted before receiving a response");
  }

  if (!response.ok) {
    throw new Error(`ZenRows request failed with status ${response.status}: ${response.statusText}`);
  }

  const body = await response.text();
  console.log("Inventory RAW RESPONSE (first 500 chars):", body.slice(0, 500)); // DEBUG

  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`ZenRows returned non-JSON payload: ${body.slice(0, 200)}`);
  }
}
