"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { getCheapestVariant, getPrimaryImage } from "@/lib/product-helpers";
import { formatPrice } from "@/lib/format";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";

export function ProductCard({ product }: { product: Product }) {
  const { user, authFetch } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const variant = getCheapestVariant(product);
  const image = getPrimaryImage(product);
  const onSale = variant?.salePrice && Number(variant.salePrice) < Number(variant.price);
  const outOfStock = variant ? variant.stock === 0 : false;

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push(`/login?redirect=/products/${product.slug}`);
      return;
    }
    setIsSaving(true);
    try {
      await authFetch(`/wishlist/${product.id}`, { method: "POST" });
      setSaved(true);
      showToast("Added to wishlist");
    } catch {
      showToast("Could not add to wishlist", "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-xl"
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-neutral-100">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className={`object-cover transition-transform duration-500 group-hover:scale-110 ${outOfStock ? "grayscale" : ""}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">No image</div>
          )}

          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.isNewArrival && (
              <span className="rounded-sm bg-neutral-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                New
              </span>
            )}
            {onSale && (
              <span className="rounded-sm bg-gold-700 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                Sale
              </span>
            )}
          </div>

          {outOfStock && (
            <div className="absolute inset-x-0 bottom-0 bg-neutral-900/80 py-1.5 text-center text-[11px] uppercase tracking-wider text-white">
              Out of Stock
            </div>
          )}
        </div>
        <div className="space-y-1 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-400">{product.brand}</p>
          <h3 className="truncate font-display text-base font-medium text-neutral-900">{product.name}</h3>
          {variant && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-gold-800">{formatPrice(variant.salePrice ?? variant.price)}</span>
              {onSale && <span className="text-neutral-400 line-through">{formatPrice(variant.price)}</span>}
            </div>
          )}
        </div>
      </Link>

      <button
        onClick={handleWishlist}
        disabled={isSaving}
        aria-label="Add to wishlist"
        className="absolute right-3 top-3 flex h-8 w-8 translate-y-1 items-center justify-center rounded-full bg-white/90 text-neutral-700 opacity-0 shadow transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 hover:text-gold-700"
      >
        {saved ? "♥" : "♡"}
      </button>
    </motion.div>
  );
}
