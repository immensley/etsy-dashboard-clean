import fetch, { type Response } from "node-fetch";
import { parseSingleListing, type ListingDetails } from "./parser.js";

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";

export async function fetchListing(listingId: string | number): Promise<ListingDetails> {
  if (!listingId) {
    throw new Error("Missing required parameter: listing_id");
  }

  const apiKey = process.env.ZENROWS_API_KEY;
  if (!apiKey) {
    throw new Error("ZENROWS_API_KEY is not set. Please add it to your environment or .env.local file.");
  }

  const listingIdStr = String(listingId);
  const etsyUrl = `https://www.etsy.com/api/v3/ajax/public/listings/${listingIdStr}?include=reviews,inventory,media,attributes`;
  const zenRowsUrl = `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent(
    etsyUrl,
  )}&premium_proxy=true`;

  let response: Response;
  try {
    response = await fetch(zenRowsUrl, {
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

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error(`ZenRows returned non-JSON payload: ${body.slice(0, 200)}`);
  }

  const listing = parseSingleListing(parsed);
  if (!listing) {
    throw new Error("Etsy response did not contain a listing payload");
  }

  return listing;
}
