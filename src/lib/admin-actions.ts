"use server";

import { revalidateTag } from "next/cache";
import { MONITORED_LISTINGS } from "@/lib/admin-config";
import { resolveListingId } from "@/lib/listing-dashboard-service";
import { getAdminDashboardData } from "@/lib/admin-dashboard-service";

export async function refreshAdminDashboardAction() {
  revalidateTag("admin-dashboard");
  for (const item of MONITORED_LISTINGS) {
    const listingId = resolveListingId(item.input);
    revalidateTag(`listing-dashboard-${listingId}`);
  }
  return getAdminDashboardData();
}
