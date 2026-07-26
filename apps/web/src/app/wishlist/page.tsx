"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { RequireAuth } from "@/components/require-auth";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGrid, StaggerItem } from "@/components/motion/stagger-grid";
import { formatPrice } from "@/lib/format";
import { getCheapestVariant, getPrimaryImage } from "@/lib/product-helpers";
import type { WishlistItem } from "@/lib/types";

function WishlistContent() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  function load() {
    setIsLoading(true);
    authFetch<WishlistItem[]>("/wishlist")
      .then(setItems)
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRemove(productId: string) {
    await authFetch(`/wishlist/${productId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <FadeIn>
        <h1 className="mb-8 font-display text-3xl font-semibold text-neutral-900">Your Wishlist</h1>
      </FadeIn>

      {isLoading ? (
        <p className="text-neutral-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-neutral-500">Your wishlist is empty.</p>
      ) : (
        <StaggerGrid className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence>
            {items.map((item) => {
              const variant = getCheapestVariant(item.product);
              const image = getPrimaryImage(item.product);
              return (
                <StaggerItem key={item.id}>
                  <motion.div
                    layout
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="overflow-hidden rounded-lg border border-neutral-200 transition-shadow hover:shadow-lg"
                  >
                    <Link href={`/products/${item.product.slug}`} className="block aspect-square overflow-hidden bg-neutral-100">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image}
                          alt={item.product.name}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                        />
                      ) : null}
                    </Link>
                    <div className="p-4">
                      <Link href={`/products/${item.product.slug}`} className="text-sm font-medium text-neutral-900 hover:text-gold-700">
                        {item.product.name}
                      </Link>
                      {variant && <p className="mt-1 text-sm text-neutral-600">{formatPrice(variant.salePrice ?? variant.price)}</p>}
                      <button onClick={() => handleRemove(item.productId)} className="mt-2 text-xs text-red-600 hover:underline">
                        Remove
                      </button>
                    </div>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </AnimatePresence>
        </StaggerGrid>
      )}
    </div>
  );
}

export default function WishlistPage() {
  return (
    <RequireAuth>
      <WishlistContent />
    </RequireAuth>
  );
}
