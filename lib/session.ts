import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type OrgContext = {
  id: string;
  name: string;
  currency: string;
  country: string;
  role: string;
  userId: string;
  email: string;
};

function friendly(message: string) {
  if (
    message.includes("memberships") ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  ) {
    return "The Aisle tables are not in this Supabase project yet. Run supabase/migrations/20260929120000_init.sql in the SQL editor, then reload.";
  }
  return message;
}

export const getSession = cache(async () => {
  if (!isSupabaseConfigured()) {
    return { configured: false as const, user: null, org: null, supabase: null };
  }

  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    return { configured: true as const, user: null, org: null, supabase };
  }

  const { data, error } = await supabase
    .from("memberships")
    .select("role, org:organizations(id, name, currency, country)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(friendly(error.message));

  const orgValue = data?.org as
    | { id: string; name: string; currency?: string | null; country?: string | null }
    | { id: string; name: string; currency?: string | null; country?: string | null }[]
    | null;
  const orgRow = Array.isArray(orgValue) ? orgValue[0] : orgValue;

  return {
    configured: true as const,
    user,
    supabase,
    org: orgRow
      ? {
          id: orgRow.id,
          name: orgRow.name,
          currency: orgRow.currency || "USD",
          country: orgRow.country || "",
          role: data?.role ?? "owner",
          userId: user.id,
          email: user.email ?? ""
        }
      : null
  };
});

export async function requireOrg() {
  const session = await getSession();
  if (!session.configured) redirect("/");
  if (!session.user) redirect("/login");
  if (!session.org || !session.supabase) redirect("/start");
  return {
    supabase: session.supabase,
    org: session.org
  };
}
