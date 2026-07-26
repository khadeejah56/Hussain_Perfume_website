"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/format";
import { FadeIn } from "@/components/motion/fade-in";

export default function CartPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { cart, isLoading, updateItem, removeItem } = useCart();

  if (authLoading) return null;

  if (!user) {
    return (
      <FadeIn className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-neutral-900">Your cart</h1>
        <p className="mt-3 text-neutral-600">Please log in to view your cart.</p>
        <Link href="/login?redirect=/cart" className="mt-6 inline-block rounded-full bg-neutral-900 px-6 py-2.5 text-sm text-white transition-transform hover:scale-105">
          Log In
        </Link>
      </FadeIn>
    );
  }

  if (isLoading && !cart) {
    return <div className="mx-auto max-w-4xl px-4 py-20 text-center text-neutral-500">Loading cart...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <FadeIn className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-neutral-900">Your cart is empty</h1>
        <Link href="/products" className="mt-6 inline-block rounded-full bg-neutral-900 px-6 py-2.5 text-sm text-white transition-transform hover:scale-105">
          Continue Shopping
        </Link>
      </FadeIn>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <FadeIn>
        <h1 className="mb-8 font-display text-3xl font-semibold text-neutral-900">Your Cart</h1>
      </FadeIn>

      <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
        <AnimatePresence initial={false}>
          {cart.items.map((item) => {
            const image = [...item.variant.product.images].sort((a, b) => a.position - b.position)[0]?.url ?? null;
            const unitPrice = Number(item.variant.salePrice ?? item.variant.price);
            return (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-4 overflow-hidden py-5"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded bg-neutral-100">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={item.variant.product.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <Link href={`/products/${item.variant.product.slug}`} className="font-medium text-neutral-900 hover:text-gold-700">
                    {item.variant.product.name}
                  </Link>
                  <p className="text-sm text-neutral-500">{item.variant.volumeMl}ml</p>
                  <p className="text-sm text-neutral-500">{formatPrice(unitPrice)} each</p>
                </div>
                <input
                  type="number"
                  min={1}
                  max={item.variant.stock}
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, Math.max(1, Number(e.target.value)))}
                  className="w-16 rounded border border-neutral-300 px-2 py-1 text-center"
                />
                <p className="w-24 text-right font-medium text-neutral-900">{formatPrice(unitPrice * item.quantity)}</p>
                <button onClick={() => removeItem(item.id)} className="text-sm text-neutral-400 transition-colors hover:text-red-600">
                  Remove
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <div className="mt-8 flex justify-end">
        <div className="w-full max-w-xs space-y-3">
          <div className="flex justify-between text-neutral-600">
            <span>Subtotal</span>
            <motion.span key={cart.subtotal} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>
              {formatPrice(cart.subtotal)}
            </motion.span>
          </div>
          <Link
            href="/checkout"
            className="block rounded-full bg-neutral-900 px-6 py-3 text-center text-sm font-medium text-white transition-all hover:scale-[1.02] hover:bg-gold-700"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
