"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { formatDate, formatPrice } from "@/lib/format";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/order-status-badge";
import { FadeIn } from "@/components/motion/fade-in";
import type { Order } from "@/lib/types";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { authFetch } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch<Order>(`/orders/${id}`)
      .then(setOrder)
      .catch(() => setError("Order not found"));
  }, [authFetch, id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!order) return <p className="text-neutral-500">Loading...</p>;

  return (
    <FadeIn>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-neutral-900">{order.orderNumber}</h1>
          <p className="text-sm text-neutral-500">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.5fr_1fr]">
        <div>
          <h2 className="mb-3 font-medium text-neutral-900">Items</h2>
          <ul className="divide-y divide-neutral-200 border-y border-neutral-200 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between py-3">
                <span>
                  {item.productName} ({item.variantLabel}) x{item.quantity}
                </span>
                <span>{formatPrice(item.totalPrice)}</span>
              </li>
            ))}
          </ul>

          <h2 className="mb-3 mt-8 font-medium text-neutral-900">Shipping Address</h2>
          <p className="text-sm text-neutral-600">
            {order.shippingFullName}
            <br />
            {order.shippingPhone}
            <br />
            {order.shippingLine1}
            {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
            <br />
            {order.shippingCity}
            {order.shippingState ? `, ${order.shippingState}` : ""} {order.shippingPostalCode}
            <br />
            {order.shippingCountry}
          </p>

          {order.customerNote && (
            <>
              <h2 className="mb-2 mt-6 font-medium text-neutral-900">Note</h2>
              <p className="text-sm text-neutral-600">{order.customerNote}</p>
            </>
          )}
        </div>

        <div className="h-fit rounded-lg border border-neutral-200 p-5 text-sm">
          <h2 className="mb-3 font-medium text-neutral-900">Payment</h2>
          <p className="mb-4 text-neutral-600">{order.paymentMethod.replace("_", " ")}</p>

          <div className="space-y-1 border-t border-neutral-200 pt-3 text-neutral-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount</span>
                <span>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{formatPrice(order.shippingAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-neutral-900">
              <span>Total</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
