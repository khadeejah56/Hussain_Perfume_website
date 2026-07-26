"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/context/toast-context";
import { ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { AddressForm, type AddressFormValues } from "@/components/address-form";
import { FadeIn } from "@/components/motion/fade-in";
import type { Address, CouponValidation, Order, PaymentMethod } from "@/lib/types";

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: "Cash on Delivery", value: "COD" },
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
  { label: "EasyPaisa", value: "EASYPAISA" },
  { label: "JazzCash", value: "JAZZCASH" },
  { label: "Card (Stripe)", value: "STRIPE" },
  { label: "PayPal", value: "PAYPAL" },
];

export default function CheckoutPage() {
  const { user, isLoading: authLoading, authFetch } = useAuth();
  const { cart, isLoading: cartLoading, refresh: refreshCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [shippingAddressId, setShippingAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<CouponValidation | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [customerNote, setCustomerNote] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    authFetch<Address[]>("/addresses").then((data) => {
      setAddresses(data);
      const preferred = data.find((a) => a.isDefault) ?? data[0];
      if (preferred) setShippingAddressId(preferred.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (authLoading || cartLoading) return null;

  if (!user) {
    return (
      <FadeIn className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-neutral-900">Checkout</h1>
        <p className="mt-3 text-neutral-600">Please log in to continue to checkout.</p>
        <Link href="/login?redirect=/checkout" className="mt-6 inline-block rounded-full bg-neutral-900 px-6 py-2.5 text-sm text-white transition-transform hover:scale-105">
          Log In
        </Link>
      </FadeIn>
    );
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

  async function handleCreateAddress(values: AddressFormValues) {
    const created = await authFetch<Address>("/addresses", { method: "POST", body: values });
    setAddresses((prev) => [created, ...prev]);
    setShippingAddressId(created.id);
    setShowNewAddress(false);
  }

  async function handleApplyCoupon() {
    setCouponError(null);
    setCouponResult(null);
    if (!couponCode.trim() || !cart) return;
    try {
      const result = await authFetch<CouponValidation>("/coupons/validate", {
        method: "POST",
        body: { code: couponCode.trim(), orderAmount: cart.subtotal },
      });
      setCouponResult(result);
      showToast(`Coupon applied: -${formatPrice(result.discountAmount)}`);
    } catch (error) {
      setCouponError(error instanceof ApiError ? error.message : "Invalid coupon");
    }
  }

  async function handlePlaceOrder() {
    if (!shippingAddressId) {
      setOrderError("Please select or add a shipping address");
      return;
    }
    setIsPlacingOrder(true);
    setOrderError(null);
    try {
      const order = await authFetch<Order>("/orders", {
        method: "POST",
        body: {
          shippingAddressId,
          paymentMethod,
          couponCode: couponResult ? couponCode.trim() : undefined,
          customerNote: customerNote || undefined,
        },
      });
      await refreshCart();
      router.push(`/account/orders/${order.id}`);
    } catch (error) {
      setOrderError(error instanceof ApiError ? error.message : "Could not place your order");
    } finally {
      setIsPlacingOrder(false);
    }
  }

  const discount = couponResult?.discountAmount ?? 0;
  const total = Math.max(0, cart.subtotal - discount);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <FadeIn>
        <h1 className="mb-8 font-display text-3xl font-semibold text-neutral-900">Checkout</h1>
      </FadeIn>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-medium text-neutral-900">Shipping Address</h2>
            <div className="space-y-2">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`block cursor-pointer rounded border p-3 text-sm ${
                    shippingAddressId === address.id ? "border-gold-700 bg-gold-50" : "border-neutral-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="shippingAddress"
                    className="mr-2"
                    checked={shippingAddressId === address.id}
                    onChange={() => setShippingAddressId(address.id)}
                  />
                  <span className="font-medium">{address.label}</span> — {address.fullName}, {address.line1},{" "}
                  {address.city}, {address.country}
                </label>
              ))}
            </div>

            {showNewAddress ? (
              <div className="mt-4 rounded border border-neutral-200 p-4">
                <AddressForm onSubmit={handleCreateAddress} submitLabel="Save & Use Address" />
              </div>
            ) : (
              <button
                onClick={() => setShowNewAddress(true)}
                className="mt-3 text-sm text-gold-700 hover:underline"
              >
                + Add a new address
              </button>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-medium text-neutral-900">Payment Method</h2>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className={`cursor-pointer rounded border p-3 text-sm ${
                    paymentMethod === method.value ? "border-gold-700 bg-gold-50" : "border-neutral-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    className="mr-2"
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value)}
                  />
                  {method.label}
                </label>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-medium text-neutral-900">Order Notes (optional)</h2>
            <textarea
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              rows={2}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Delivery instructions, gift note, etc."
            />
          </section>
        </div>

        <FadeIn delay={0.1} className="h-fit rounded-lg border border-neutral-200 p-5">
          <h2 className="mb-4 font-medium text-neutral-900">Order Summary</h2>
          <ul className="mb-4 space-y-2 text-sm text-neutral-600">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {item.variant.product.name} ({item.variant.volumeMl}ml) x{item.quantity}
                </span>
                <span>{formatPrice(Number(item.variant.salePrice ?? item.variant.price) * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mb-4 flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Coupon code"
              className="flex-1 rounded border border-neutral-300 px-3 py-1.5 text-sm"
            />
            <button
              onClick={handleApplyCoupon}
              className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:border-gold-700"
            >
              Apply
            </button>
          </div>
          {couponError && <p className="mb-3 text-sm text-red-600">{couponError}</p>}

          <div className="space-y-1 border-t border-neutral-200 pt-3 text-sm text-neutral-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold text-neutral-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <AnimatePresence>
            {orderError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 text-sm text-red-600"
              >
                {orderError}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            className="mt-5 w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gold-700 disabled:opacity-50"
          >
            {isPlacingOrder ? "Placing Order..." : "Place Order"}
          </motion.button>
        </FadeIn>
      </div>
    </div>
  );
}
