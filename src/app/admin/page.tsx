import { getAdminDashboardData } from "@/lib/admin-dashboard-service";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";

export default async function AdminPage() {
  const data = await getAdminDashboardData();
  return <AdminDashboardClient data={data} />;
}
