"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { ApiError } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/order-status-badge";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
];

const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];

const COMMON_COURIERS = ["Leopards Courier", "TCS", "M&P", "PostEx", "Trax", "BlueEx", "Rider", "Swyft"];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { authFetch } = useAuth();
  const { showToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [statusChoice, setStatusChoice] = useState<OrderStatus>("PENDING");
  const [paymentChoice, setPaymentChoice] = useState<PaymentStatus>("PENDING");
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  function load() {
    authFetch<Order>(`/orders/admin/${id}`).then((data) => {
      setOrder(data);
      setStatusChoice(data.status);
      setPaymentChoice(data.paymentStatus);
      setCourierName(data.courierName ?? "");
      setTrackingNumber(data.trackingNumber ?? "");
    });
  }

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpdateStatus() {
    setIsSavingStatus(true);
    try {
      await authFetch(`/orders/admin/${id}/status`, { method: "PATCH", body: { status: statusChoice } });
      showToast("Order status updated");
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not update status", "error");
    } finally {
      setIsSavingStatus(false);
    }
  }

  async function handleUpdatePayment() {
    setIsSavingPayment(true);
    try {
      await authFetch(`/orders/admin/${id}/payment`, { method: "PATCH", body: { status: paymentChoice } });
      showToast("Payment status updated");
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not update payment status", "error");
    } finally {
      setIsSavingPayment(false);
    }
  }

  async function handleDispatch() {
    if (!courierName.trim() || !trackingNumber.trim()) {
      showToast("Enter courier name and tracking number", "error");
      return;
    }
    setIsDispatching(true);
    try {
      await authFetch(`/orders/admin/${id}/dispatch`, {
        method: "PATCH",
        body: { courierName: courierName.trim(), trackingNumber: trackingNumber.trim() },
      });
      showToast("Order dispatched");
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not dispatch order", "error");
    } finally {
      setIsDispatching(false);
    }
  }

  if (!order) return <p className="text-neutral-500">Loading...</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-neutral-900">{order.orderNumber}</h2>
          <p className="text-sm text-neutral-500">Placed {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-medium text-neutral-900">Customer</h3>
            <p className="text-sm text-neutral-600">
              {order.user ? `${order.user.firstName} ${order.user.lastName} — ${order.user.email}` : "—"}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-neutral-900">Items</h3>
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
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-neutral-900">Shipping Address</h3>
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
          </div>

          {order.customerNote && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-neutral-900">Note</h3>
              <p className="text-sm text-neutral-600">{order.customerNote}</p>
            </div>
          )}

          <div className="rounded-lg border border-neutral-200 p-5">
            <h3 className="mb-3 text-sm font-medium text-neutral-900">Dispatch</h3>
            {order.dispatchedAt ? (
              <p className="mb-3 text-sm text-neutral-600">
                Dispatched {formatDate(order.dispatchedAt)} via <strong>{order.courierName}</strong>, tracking{" "}
                <strong>{order.trackingNumber}</strong>
              </p>
            ) : (
              <p className="mb-3 text-sm text-neutral-500">Not dispatched yet.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <input
                list="couriers"
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                placeholder="Courier name"
                className="rounded border border-neutral-300 px-3 py-1.5 text-sm"
              />
              <datalist id="couriers">
                {COMMON_COURIERS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Tracking number"
                className="rounded border border-neutral-300 px-3 py-1.5 text-sm"
              />
              <button
                onClick={handleDispatch}
                disabled={isDispatching}
                className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm text-white hover:bg-gold-700 disabled:opacity-50"
              >
                {isDispatching ? "Saving..." : order.dispatchedAt ? "Update Dispatch Info" : "Mark as Dispatched"}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-neutral-200 p-5 text-sm">
            <div className="space-y-1 text-neutral-600">
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
              <div className="flex justify-between text-base font-semibold text-neutral-900">
                <span>Total</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
            <p className="mt-3 text-neutral-500">Payment: {order.paymentMethod.replace("_", " ")}</p>
          </div>

          <div className="rounded-lg border border-neutral-200 p-5">
            <h3 className="mb-2 text-sm font-medium text-neutral-900">Update Order Status</h3>
            <div className="flex gap-2">
              <select
                value={statusChoice}
                onChange={(e) => setStatusChoice(e.target.value as OrderStatus)}
                className="flex-1 rounded border border-neutral-300 px-3 py-1.5 text-sm"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                onClick={handleUpdateStatus}
                disabled={isSavingStatus}
                className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:border-gold-600 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 p-5">
            <h3 className="mb-2 text-sm font-medium text-neutral-900">Update Payment Status</h3>
            <div className="flex gap-2">
              <select
                value={paymentChoice}
                onChange={(e) => setPaymentChoice(e.target.value as PaymentStatus)}
                className="flex-1 rounded border border-neutral-300 px-3 py-1.5 text-sm"
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                onClick={handleUpdatePayment}
                disabled={isSavingPayment}
                className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:border-gold-600 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
