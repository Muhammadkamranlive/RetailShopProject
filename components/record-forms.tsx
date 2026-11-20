"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createPurchaseOrder, createSale } from "@/app/actions/commerce";
import { createSku, type FormState } from "@/app/actions/catalog";
import { Field, PrimarySubmit, inputClass } from "@/components/ui";

type Option = { id: string; name: string };
type SkuOption = Option & { sku: string };

export function SkuForm({
  categories,
  suppliers
}: {
  categories: Option[];
  suppliers: Option[];
}) {
  const [state, action] = useActionState(createSku, null as FormState);
  return (
    <form action={action} className="grid gap-3">
      {state?.error ? <p className="rounded-xl bg-[#f8e8e1] px-3 py-2 text-sm text-copper">{state.error}</p> : null}
      <Field label="Product">
        <input className={inputClass} name="name" required placeholder="Harbor Whole Milk 1L" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Brand">
          <input className={inputClass} name="brand" placeholder="Harbor" />
        </Field>
        <Field label="SKU">
          <input className={inputClass} name="sku" required placeholder="HRB-MILK-1L" />
        </Field>
      </div>
      <Field label="Category">
        <select className={inputClass} name="category_id" required defaultValue="">
          <option value="" disabled>
            Choose
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Supplier">
        <select className={inputClass} name="supplier_id" defaultValue="">
          <option value="">None yet</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cost">
          <input className={inputClass} name="cost" type="number" min="0" step="0.01" required defaultValue="1.00" />
        </Field>
        <Field label="Price">
          <input className={inputClass} name="price" type="number" min="0" step="0.01" required defaultValue="2.40" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Reorder point">
          <input className={inputClass} name="reorder_point" type="number" min="0" defaultValue="12" />
        </Field>
        <Field label="Reorder qty">
          <input className={inputClass} name="reorder_qty" type="number" min="0" defaultValue="24" />
        </Field>
      </div>
      <Field label="Barcode">
        <input className={inputClass} name="barcode" placeholder="Optional" />
      </Field>
      <PrimarySubmit>Add to catalog</PrimarySubmit>
    </form>
  );
}

function LineEditor({ skus, hint }: { skus: SkuOption[]; hint?: (id: string) => string }) {
  const [rows, setRows] = useState([0]);
  return (
    <div className="space-y-2">
      {rows.map((key) => (
        <div key={key} className="grid grid-cols-12 gap-2">
          <select className={`${inputClass} col-span-8`} name="sku_id" required defaultValue="">
            <option value="" disabled>
              Product
            </option>
            {skus.map((sku) => (
              <option key={sku.id} value={sku.id}>
                {sku.name}
                {hint ? ` · ${hint(sku.id)}` : ""}
              </option>
            ))}
          </select>
          <input className={`${inputClass} col-span-4`} name="qty" type="number" min="1" defaultValue="1" required />
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-pine-dark underline-offset-4 hover:underline"
        onClick={() => setRows((current) => [...current, current.length + Date.now()])}
      >
        Add line
      </button>
    </div>
  );
}

export function PurchaseOrderForm({
  suppliers,
  stores,
  skus
}: {
  suppliers: Option[];
  stores: Option[];
  skus: SkuOption[];
}) {
  const [state, action] = useActionState(createPurchaseOrder, null as FormState);
  return (
    <form action={action} className="grid gap-3">
      {state?.error ? <p className="rounded-xl bg-[#f8e8e1] px-3 py-2 text-sm text-copper">{state.error}</p> : null}
      <Field label="Supplier">
        <select className={inputClass} name="supplier_id" required defaultValue={suppliers[0]?.id ?? ""}>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Receive into">
        <select className={inputClass} name="store_id" required defaultValue={stores[0]?.id ?? ""}>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Expected">
        <input className={inputClass} name="expected_at" type="date" />
      </Field>
      <Field label="Status">
        <select className={inputClass} name="status" defaultValue="sent">
          <option value="sent">Send now</option>
          <option value="draft">Keep as draft</option>
        </select>
      </Field>
      <LineEditor skus={skus} />
      <PrimarySubmit>Save purchase order</PrimarySubmit>
    </form>
  );
}

export function OrderForm({
  stores,
  customers,
  skus,
  levels
}: {
  stores: Option[];
  customers: Option[];
  skus: SkuOption[];
  levels: { storeId: string; skuId: string; onHand: number }[];
}) {
  const [state, action] = useActionState(createSale, null as FormState);
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  return (
    <form action={action} className="grid gap-3">
      {state?.error ? <p className="rounded-xl bg-[#f8e8e1] px-3 py-2 text-sm text-copper">{state.error}</p> : null}
      <Field label="Channel">
        <select className={inputClass} name="channel" defaultValue="store">
          <option value="store">Store</option>
          <option value="web">Web shop</option>
          <option value="marketplace">Marketplace</option>
        </select>
      </Field>
      <Field label="Fulfill from">
        <select
          className={inputClass}
          name="store_id"
          required
          value={storeId}
          onChange={(event) => setStoreId(event.target.value)}
        >
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Customer">
        <select className={inputClass} name="customer_id" defaultValue="">
          <option value="">Walk-up, no profile</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </Field>
      <LineEditor
        key={storeId}
        skus={skus}
        hint={(id) => {
          const level = levels.find((row) => row.storeId === storeId && row.skuId === id);
          return `${level?.onHand ?? 0} on hand`;
        }}
      />
      <PrimarySubmit>Fulfill order</PrimarySubmit>
    </form>
  );
}
