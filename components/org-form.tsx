"use client";

import { useActionState } from "react";
import { createOrganization, type OrgState } from "@/app/actions/network";
import { Field, PrimarySubmit, inputClass } from "@/components/ui";
import { currencies } from "@/lib/format";

export function OrgForm() {
  const [state, action] = useActionState(createOrganization, null as OrgState);
  return (
    <form action={action} className="grid max-w-md gap-3">
      {state?.error ? <p className="rounded-xl bg-[#f8e8e1] px-3 py-2 text-sm text-copper">{state.error}</p> : null}
      <Field label="Company">
        <input className={inputClass} name="name" required minLength={2} placeholder="Northwind Retail" />
      </Field>
      <Field label="Currency">
        <select className={inputClass} name="currency" defaultValue="USD">
          {currencies.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Country">
        <input className={inputClass} name="country" placeholder="United States" />
      </Field>
      <PrimarySubmit>Create the company</PrimarySubmit>
    </form>
  );
}
