import type { Product, ProductVariant } from "./types";

export function getCheapestVariant(product: Product): ProductVariant | null {
  const candidates = product.variants.filter((v) => v.isActive);
  const pool = candidates.length ? candidates : product.variants;
  if (pool.length === 0) return null;

  return pool.reduce((cheapest, variant) => {
    const price = Number(variant.salePrice ?? variant.price);
    const cheapestPrice = Number(cheapest.salePrice ?? cheapest.price);
    return price < cheapestPrice ? variant : cheapest;
  }, pool[0]);
}

export function getPrimaryImage(product: Product): string | null {
  const sorted = [...product.images].sort((a, b) => a.position - b.position);
  return sorted[0]?.url ?? null;
}
