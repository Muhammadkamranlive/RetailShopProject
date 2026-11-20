import { createCategory } from "@/app/actions/catalog";
import { SkuForm } from "@/components/record-forms";
import { Flash, PageHeader, Panel, PrimarySubmit, Table, Td, Th, inputClass } from "@/components/ui";
import { money } from "@/lib/format";
import { listCategories, listSkus, listSuppliers } from "@/lib/queries";
import { requireOrg } from "@/lib/session";

export const metadata = { title: "Catalog" };

export default async function CatalogPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; notice?: string; q?: string }>;
}) {
  const query = await searchParams;
  const { org } = await requireOrg();
  const [categories, suppliers, skus] = await Promise.all([
    listCategories(org.id),
    listSuppliers(org.id),
    listSkus(org.id)
  ]);
  const needle = (query.q ?? "").trim().toLowerCase();
  const visible = needle
    ? skus.filter((sku) => `${sku.name} ${sku.sku} ${sku.brand} ${sku.category}`.toLowerCase().includes(needle))
    : skus;

  return (
    <>
      <PageHeader
        eyebrow="Product management"
        title="What the chain sells"
        lede="The catalog is the shared product list. It holds the name, price, cost, and supplier. It does not hold stock. Units appear on Inventory only after a purchase order is received into a shop."
      />
      <Flash error={query.error} notice={query.notice} />
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <Panel title="New product">
            {categories.length === 0 ? (
              <p className="text-sm text-muted">Add a category before the first product.</p>
            ) : (
              <SkuForm categories={categories} suppliers={suppliers} />
            )}
          </Panel>
          <Panel title="Category">
            <form action={createCategory} className="flex gap-2">
              <input className={inputClass} name="name" required placeholder="Dairy" />
              <PrimarySubmit>Add</PrimarySubmit>
            </form>
          </Panel>
        </div>
        <div>
          <form className="mb-3" method="get">
            <input className={inputClass} name="q" defaultValue={query.q ?? ""} placeholder="Search name, SKU, or brand" />
          </form>
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th>Supplier</Th>
                <Th className="text-right">Cost</Th>
                <Th className="text-right">Price</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((sku) => (
                <tr key={sku.id}>
                  <Td>
                    <p>{sku.name}</p>
                    <p className="text-xs text-muted">{sku.sku}{sku.barcode ? ` · ${sku.barcode}` : ""}</p>
                  </Td>
                  <Td>{sku.category}</Td>
                  <Td>{sku.supplierName ?? "—"}</Td>
                  <Td className="text-right">{money(sku.cost, org.currency)}</Td>
                  <Td className="text-right">{money(sku.price, org.currency)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </>
  );
}
