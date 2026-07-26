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

export function getPriceRange(product: Product): { min: number; max: number } | null {
  if (product.variants.length === 0) return null;
  const prices = product.variants.map((v) => Number(v.salePrice ?? v.price));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function getTotalStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}
