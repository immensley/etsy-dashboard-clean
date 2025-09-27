import { DEFAULT_SHOP_ID } from "@/lib/dashboard-defaults";
import { getSectionDashboardData, getSectionMetadata } from "@/lib/section-dashboard-service";
import { SectionDashboardClient } from "@/components/sections/section-dashboard-client";

export default async function SectionsPage({ searchParams }: { searchParams?: { section?: string } }) {
  const shopId = DEFAULT_SHOP_ID;
  const sectionId = searchParams?.section;
  const [metadata, initialData] = await Promise.all([
    getSectionMetadata(shopId),
    getSectionDashboardData(shopId, sectionId),
  ]);

  return <SectionDashboardClient shopId={shopId} metadata={metadata} initialData={initialData} />;
}
