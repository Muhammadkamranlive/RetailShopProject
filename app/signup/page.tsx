import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create an account"
      lede="You own the chain. Next you name it and load Harbor & Rye, a sample with four shops, so the screens have real stock to show."
      footer={
        <>
          Already registered?{" "}
          <Link className="text-ink underline-offset-4 hover:underline" href="/login">
            Sign in
          </Link>
        </>
      }
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
