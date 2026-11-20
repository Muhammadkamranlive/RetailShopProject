"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { text } from "@/lib/form";

export type AuthState = { error?: string; message?: string } | null;

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Add the Supabase URL and anon key to .env.local first." };
  const email = text(formData, "email");
  const password = text(formData, "password");
  const next = text(formData, "next");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/home");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Add the Supabase URL and anon key to .env.local first." };
  const email = text(formData, "email");
  const password = text(formData, "password");
  const fullName = text(formData, "full_name");
  if (password.length < 8) return { error: "Use at least 8 characters." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });
  if (error) return { error: error.message };
  if (!data.session) {
    return {
      message: "Account created. Confirm the email, then sign in. For a demo project, turn off Confirm email in Supabase Authentication settings."
    };
  }
  redirect("/start");
}
