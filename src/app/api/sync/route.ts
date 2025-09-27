import { NextResponse } from "next/server";
import { DEFAULT_SHOP_ID } from "@/lib/dashboard-defaults";
import { MONITORED_LISTINGS } from "@/lib/admin-config";
import { loadListingDashboardData } from "@/lib/listing-dashboard-service";
import { loadAdminDashboardData } from "@/lib/admin-dashboard-service";
import { getSectionMetadata, loadSectionDashboardData } from "@/lib/section-dashboard-service";

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return true;
  }
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const shopId = DEFAULT_SHOP_ID;
  const sectionMeta = await getSectionMetadata(shopId);

  await Promise.all([
    loadAdminDashboardData(),
    ...MONITORED_LISTINGS.map((item) => loadListingDashboardData(item.input)),
    ...sectionMeta.map((section) => loadSectionDashboardData(shopId, section.sectionId)),
  ]);

  return NextResponse.json({
    ok: true,
    listings: MONITORED_LISTINGS.length,
    sections: sectionMeta.length,
    timestamp: new Date().toISOString(),
  });
}
