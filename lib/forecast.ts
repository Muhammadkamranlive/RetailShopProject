export type ForecastSku = {
  id: string;
  sku: string;
  name: string;
  cost: number;
  reorderPoint: number;
  reorderQty: number;
  supplierId: string | null;
  supplierName: string | null;
  leadTimeDays: number;
};

export type ForecastLevel = {
  storeId: string;
  storeName: string;
  skuId: string;
  onHand: number;
};

export type ForecastSale = {
  skuId: string;
  qty: number;
};

export type ForecastInbound = {
  skuId: string;
  qty: number;
};

export type ForecastRow = {
  skuId: string;
  sku: string;
  name: string;
  supplierId: string | null;
  supplierName: string | null;
  leadTimeDays: number;
  soldQty: number;
  daily: number;
  coverDays: number;
  safety: number;
  onHand: number;
  inbound: number;
  suggested: number;
  cost: number;
};

export type TransferRow = {
  skuId: string;
  sku: string;
  name: string;
  fromStoreId: string;
  fromStoreName: string;
  toStoreId: string;
  toStoreName: string;
  qty: number;
};

const HISTORY_DAYS = 28;

export function buildForecast(input: {
  skus: ForecastSku[];
  levels: ForecastLevel[];
  sales: ForecastSale[];
  inbound: ForecastInbound[];
  storeCount: number;
}): ForecastRow[] {
  const sold = new Map<string, number>();
  for (const sale of input.sales) {
    sold.set(sale.skuId, (sold.get(sale.skuId) ?? 0) + sale.qty);
  }
  const incoming = new Map<string, number>();
  for (const row of input.inbound) {
    incoming.set(row.skuId, (incoming.get(row.skuId) ?? 0) + row.qty);
  }
  const onHand = new Map<string, number>();
  for (const level of input.levels) {
    onHand.set(level.skuId, (onHand.get(level.skuId) ?? 0) + level.onHand);
  }

  const stores = Math.max(input.storeCount, 1);

  return input.skus
    .map((sku) => {
      const soldQty = sold.get(sku.id) ?? 0;
      const daily = soldQty / HISTORY_DAYS;
      const coverDays = Math.max(14, sku.leadTimeDays + 7);
      const safety = sku.reorderPoint * stores;
      const hand = onHand.get(sku.id) ?? 0;
      const inboundQty = incoming.get(sku.id) ?? 0;
      const target = daily * coverDays + safety;
      const suggested = Math.max(0, Math.ceil(target - hand - inboundQty));
      return {
        skuId: sku.id,
        sku: sku.sku,
        name: sku.name,
        supplierId: sku.supplierId,
        supplierName: sku.supplierName,
        leadTimeDays: sku.leadTimeDays,
        soldQty,
        daily,
        coverDays,
        safety,
        onHand: hand,
        inbound: inboundQty,
        suggested,
        cost: sku.cost
      };
    })
    .sort((a, b) => b.suggested - a.suggested || b.soldQty - a.soldQty);
}

export function buildTransfers(input: {
  skus: ForecastSku[];
  levels: ForecastLevel[];
}): TransferRow[] {
  const bySku = new Map<string, ForecastLevel[]>();
  for (const level of input.levels) {
    const list = bySku.get(level.skuId) ?? [];
    list.push({ ...level });
    bySku.set(level.skuId, list);
  }

  const transfers: TransferRow[] = [];
  for (const sku of input.skus) {
    const balances = (bySku.get(sku.id) ?? []).map((row) => ({ ...row }));
    const needy = balances
      .filter((row) => row.onHand < sku.reorderPoint)
      .sort((a, b) => a.onHand - b.onHand);
    const donors = balances
      .filter((row) => row.onHand > sku.reorderPoint)
      .sort((a, b) => b.onHand - a.onHand);

    for (const need of needy) {
      let short = sku.reorderPoint - need.onHand;
      for (const donor of donors) {
        if (short <= 0) break;
        const spare = donor.onHand - sku.reorderPoint;
        if (spare <= 0) continue;
        const qty = Math.min(short, spare);
        donor.onHand -= qty;
        need.onHand += qty;
        short -= qty;
        transfers.push({
          skuId: sku.id,
          sku: sku.sku,
          name: sku.name,
          fromStoreId: donor.storeId,
          fromStoreName: donor.storeName,
          toStoreId: need.storeId,
          toStoreName: need.storeName,
          qty
        });
      }
    }
  }

  return transfers;
}
