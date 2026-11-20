import { updateCompany } from "@/app/actions/network";
import { Field, Flash, PageHeader, Panel, PrimarySubmit, Table, Td, Th, inputClass } from "@/components/ui";
import { currencies, titleCase, when } from "@/lib/format";
import { listMembers } from "@/lib/queries";
import { requireOrg } from "@/lib/session";

export const metadata = { title: "Company" };

export default async function CompanyPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const { org } = await requireOrg();
  const members = await listMembers(org.id);
  const owner = org.role === "owner";

  return (
    <>
      <PageHeader
        eyebrow="Company"
        title={org.name}
        lede="This profile is what a retailer takes with them: the legal name customers see internally, the currency on every price, and the people who can sign in. Stores, catalog, and stock stay under this company."
      />
      <Flash error={query.error} notice={query.notice} />
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <Panel title="Profile">
          <form action={updateCompany} className="grid gap-3">
            <Field label="Company name">
              <input className={inputClass} name="name" required minLength={2} defaultValue={org.name} disabled={!owner} />
            </Field>
            <Field label="Currency">
              <select className={inputClass} name="currency" defaultValue={org.currency} disabled={!owner}>
                {currencies.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Country">
              <input className={inputClass} name="country" defaultValue={org.country} placeholder="United States" disabled={!owner} />
            </Field>
            {owner ? <PrimarySubmit>Save company</PrimarySubmit> : <p className="text-xs text-muted">Only an owner can change this profile.</p>}
          </form>
        </Panel>
        <section>
          <h2 className="mb-3 font-serif text-2xl">People</h2>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Joined</Th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={`${member.email}-${member.role}`}>
                  <Td>{member.name || "—"}</Td>
                  <Td>{member.email || "—"}</Td>
                  <Td>{titleCase(member.role.replaceAll("_", " "))}</Td>
                  <Td>{when(member.joinedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>
      </div>
    </>
  );
}
