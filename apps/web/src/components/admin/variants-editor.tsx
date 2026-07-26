"use client";

export interface VariantDraft {
  key: string;
  id?: string;
  sku: string;
  volumeMl: string;
  price: string;
  salePrice: string;
  stock: string;
  isActive: boolean;
}

export function emptyVariant(): VariantDraft {
  return {
    key: crypto.randomUUID(),
    sku: "",
    volumeMl: "",
    price: "",
    salePrice: "",
    stock: "0",
    isActive: true,
  };
}

export function VariantsEditor({
  variants,
  onChange,
}: {
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
}) {
  function update(key: string, patch: Partial<VariantDraft>) {
    onChange(variants.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  }

  function remove(key: string) {
    onChange(variants.filter((v) => v.key !== key));
  }

  return (
    <div className="space-y-3">
      {variants.map((variant) => (
        <div key={variant.key} className="grid grid-cols-2 gap-2 rounded border border-neutral-200 p-3 sm:grid-cols-6">
          <input
            placeholder="SKU"
            value={variant.sku}
            onChange={(e) => update(variant.key, { sku: e.target.value })}
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            placeholder="Volume (ml)"
            value={variant.volumeMl}
            onChange={(e) => update(variant.key, { volumeMl: e.target.value })}
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            placeholder="Price (Rs)"
            value={variant.price}
            onChange={(e) => update(variant.key, { price: e.target.value })}
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            placeholder="Sale price (optional)"
            value={variant.salePrice}
            onChange={(e) => update(variant.key, { salePrice: e.target.value })}
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            placeholder="Stock"
            value={variant.stock}
            onChange={(e) => update(variant.key, { stock: e.target.value })}
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-xs text-neutral-600">
              <input
                type="checkbox"
                checked={variant.isActive}
                onChange={(e) => update(variant.key, { isActive: e.target.checked })}
              />
              Active
            </label>
            <button type="button" onClick={() => remove(variant.key)} className="text-xs text-red-600 hover:underline">
              Remove
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...variants, emptyVariant()])}
        className="text-sm text-gold-700 hover:underline"
      >
        + Add Size / Variant
      </button>
    </div>
  );
}
