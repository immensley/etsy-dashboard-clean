"use server";

import { revalidateTag } from "next/cache";
import { getListingDashboardData, resolveListingId } from "@/lib/listing-dashboard-service";

export async function fetchListingDashboardAction(rawInput: string) {
  const listingId = resolveListingId(rawInput);
  revalidateTag(`listing-dashboard-${listingId}`);
  return getListingDashboardData(listingId);
}
