import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const query = await searchParams;
  const nextPath = query.next?.startsWith("/") && !query.next.startsWith("//") ? query.next : "/home";
  return (
    <AuthShell
      title="Sign in"
      lede="Open the company you already created. New here? Create an account, name the retailer, and add stores."
      footer={
        <>
          New here?{" "}
          <Link className="text-ink underline-offset-4 hover:underline" href="/signup">
            Create an account
          </Link>
        </>
      }
    >
      <AuthForm mode="login" nextPath={nextPath} />
    </AuthShell>
  );
}
