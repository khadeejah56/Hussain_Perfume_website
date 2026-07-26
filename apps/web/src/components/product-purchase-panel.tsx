"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/context/toast-context";
import { formatPrice } from "@/lib/format";
import { getCheapestVariant } from "@/lib/product-helpers";
import { FadeIn } from "@/components/motion/fade-in";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const router = useRouter();

  const images = useMemo(() => [...product.images].sort((a, b) => a.position - b.position), [product.images]);
  const [activeImage, setActiveImage] = useState(0);

  const defaultVariant = getCheapestVariant(product);
  const [variantId, setVariantId] = useState(defaultVariant?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId) ?? defaultVariant;

  async function handleAddToCart() {
    if (!user) {
      router.push(`/login?redirect=/products/${product.slug}`);
      return;
    }
    if (!variant) return;

    setIsSubmitting(true);
    try {
      await addItem(variant.id, quantity);
      showToast("Added to cart");
    } catch {
      showToast("Failed to add to cart", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <FadeIn y={0}>
        <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
          <AnimatePresence mode="wait">
            {images[activeImage] ? (
              <motion.div
                key={images[activeImage].id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Image
                  src={images[activeImage].url}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  priority
                  className="object-cover"
                />
              </motion.div>
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-400">No image available</div>
            )}
          </AnimatePresence>
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {images.map((image, idx) => (
              <button
                key={image.id}
                onClick={() => setActiveImage(idx)}
                className={`relative h-16 w-16 overflow-hidden rounded border transition-colors ${idx === activeImage ? "border-gold-700" : "border-neutral-200 hover:border-neutral-400"}`}
              >
                <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </FadeIn>

      <FadeIn delay={0.1}>
        <p className="text-sm uppercase tracking-wide text-neutral-400">{product.brand}</p>
        <h1 className="mt-1 font-display text-4xl font-semibold text-neutral-900">{product.name}</h1>
        {product.shortDescription && <p className="mt-3 text-neutral-600">{product.shortDescription}</p>}

        {variant && (
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-neutral-900">
              {formatPrice(variant.salePrice ?? variant.price)}
            </span>
            {variant.salePrice && Number(variant.salePrice) < Number(variant.price) && (
              <span className="text-neutral-400 line-through">{formatPrice(variant.price)}</span>
            )}
          </div>
        )}

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-neutral-900">Size</h2>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                disabled={!v.isActive || v.stock === 0}
                onClick={() => setVariantId(v.id)}
                className={`rounded border px-4 py-2 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                  v.id === variantId
                    ? "border-gold-700 bg-gold-50 text-gold-700 shadow-sm"
                    : "border-neutral-300 hover:border-neutral-500"
                }`}
              >
                {v.volumeMl}ml {v.stock === 0 ? "(Out of stock)" : ""}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <label htmlFor="quantity" className="text-sm font-medium text-neutral-900">
            Qty
          </label>
          <input
            id="quantity"
            type="number"
            min={1}
            max={variant?.stock ?? 1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-20 rounded border border-neutral-300 px-2 py-1.5"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleAddToCart}
            disabled={!variant || variant.stock === 0 || isSubmitting}
            className="flex-1 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gold-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {variant && variant.stock === 0 ? "Out of Stock" : isSubmitting ? "Adding..." : "Add to Cart"}
          </motion.button>
          <WishlistButton productId={product.id} productSlug={product.slug} />
        </div>

        <dl className="mt-8 space-y-3 border-t border-neutral-200 pt-6 text-sm">
          <div>
            <dt className="font-medium text-neutral-900">Description</dt>
            <dd className="mt-1 text-neutral-600">{product.description}</dd>
          </div>
          {product.topNotes.length > 0 && (
            <div>
              <dt className="font-medium text-neutral-900">Top Notes</dt>
              <dd className="mt-1 text-neutral-600">{product.topNotes.join(", ")}</dd>
            </div>
          )}
          {product.middleNotes.length > 0 && (
            <div>
              <dt className="font-medium text-neutral-900">Middle Notes</dt>
              <dd className="mt-1 text-neutral-600">{product.middleNotes.join(", ")}</dd>
            </div>
          )}
          {product.baseNotes.length > 0 && (
            <div>
              <dt className="font-medium text-neutral-900">Base Notes</dt>
              <dd className="mt-1 text-neutral-600">{product.baseNotes.join(", ")}</dd>
            </div>
          )}
        </dl>
      </FadeIn>
    </div>
  );
}

function WishlistButton({ productId, productSlug }: { productId: string; productSlug: string }) {
  const { user, authFetch } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleClick() {
    if (!user) {
      router.push(`/login?redirect=/products/${productSlug}`);
      return;
    }
    setState("saving");
    try {
      await authFetch(`/wishlist/${productId}`, { method: "POST" });
      setState("saved");
      showToast("Added to wishlist");
    } catch {
      setState("error");
      showToast("Could not add to wishlist", "error");
    }
  }

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={handleClick}
      disabled={state === "saving" || state === "saved"}
      className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 transition-colors hover:border-gold-700 hover:text-gold-700 disabled:opacity-60"
    >
      {state === "saved" ? "In Wishlist" : "Wishlist"}
    </motion.button>
  );
}
