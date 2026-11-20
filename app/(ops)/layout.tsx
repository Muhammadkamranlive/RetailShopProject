import { cookies } from "next/headers";
import { Shell } from "@/components/shell";
import { requireOrg } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const { org } = await requireOrg();
  const collapsed = (await cookies()).get("aisle-nav")?.value === "1";
  return (
    <Shell orgName={org.name} email={org.email} role={org.role} collapsed={collapsed}>
      {children}
    </Shell>
  );
}
