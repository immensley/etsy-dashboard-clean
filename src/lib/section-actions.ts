"use server";

import { revalidateTag } from "next/cache";
import { getSectionDashboardData } from "@/lib/section-dashboard-service";

export async function fetchSectionDashboardAction(shopId: string, sectionId?: string) {
  const tag = ["section-dashboard", shopId, sectionId ?? "all"].join(":");
  revalidateTag(tag);
  return getSectionDashboardData(shopId, sectionId);
}
