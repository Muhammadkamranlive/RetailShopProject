import Link from "next/link";
import { redirect } from "next/navigation";
import { OrgForm } from "@/components/org-form";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "New network" };

export default async function StartPage() {
  const session = await getSession();
  if (!session.configured) redirect("/");
  if (!session.user) redirect("/login");
  if (session.org) redirect("/home");

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-16">
      <Link href="/" className="font-serif text-3xl">
        Aisle
      </Link>
      <h1 className="mt-8 font-serif text-4xl">Name the company</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        This is the retailer that owns the stores. Currency is used on every price. A grocery sample can be loaded afterward, or you can enter your own stores.
      </p>
      <div className="mt-6">
        <OrgForm />
      </div>
    </main>
  );
}
