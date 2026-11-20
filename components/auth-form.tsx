"use client";

import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";
import { Field, PrimarySubmit, inputClass } from "@/components/ui";

export function AuthForm({ mode, nextPath = "/home" }: { mode: "login" | "signup"; nextPath?: string }) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction] = useActionState(action, null as AuthState);
  return (
    <form action={formAction} className="grid gap-3">
      {state?.error ? <p className="rounded-xl bg-[#f8e8e1] px-3 py-2 text-sm text-copper">{state.error}</p> : null}
      {state?.message ? <p className="rounded-xl bg-[#e5f3ee] px-3 py-2 text-sm text-pine-dark">{state.message}</p> : null}
      {mode === "signup" ? (
        <Field label="Name">
          <input className={inputClass} name="full_name" autoComplete="name" required />
        </Field>
      ) : null}
      <Field label="Email">
        <input className={inputClass} name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password">
        <input className={inputClass} name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required />
      </Field>
      {mode === "login" ? <input type="hidden" name="next" value={nextPath} /> : null}
      <PrimarySubmit>{mode === "login" ? "Sign in" : "Create account"}</PrimarySubmit>
    </form>
  );
}
