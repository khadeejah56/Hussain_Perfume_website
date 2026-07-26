"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { formatDate, formatPrice } from "@/lib/format";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/order-status-badge";
import type { Order, OrderStatus, PaginatedResponse } from "@/lib/types";

const STATUSES: OrderStatus[] = [
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

function AdminOrdersContent() {
  const { authFetch } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [result, setResult] = useState<PaginatedResponse<Order> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) query.set("status", status);
    authFetch<PaginatedResponse<Order>>(`/orders/admin?${query.toString()}`)
      .then(setResult)
      .finally(() => setIsLoading(false));
  }, [authFetch, status, page]);

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/admin/orders?${params.toString()}`);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-medium text-neutral-900">Orders</h2>
        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value, page: "" })}
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-neutral-500">Loading...</p>
      ) : !result || result.data.length === 0 ? (
        <p className="text-neutral-500">No orders found.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {result.data.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-medium text-neutral-900">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {order.user ? `${order.user.firstName} ${order.user.lastName}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{formatPrice(order.totalAmount)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/orders/${order.id}`} className="text-gold-700 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-center gap-3 text-sm">
            <button
              onClick={() => updateParams({ page: String(Math.max(1, page - 1)) })}
              disabled={page === 1}
              className="rounded border px-3 py-1.5 disabled:opacity-30"
            >
              Prev
            </button>
            <span className="py-1.5">
              Page {result.meta.page} of {result.meta.totalPages}
            </span>
            <button
              onClick={() => updateParams({ page: String(Math.min(result.meta.totalPages, page + 1)) })}
              disabled={page === result.meta.totalPages}
              className="rounded border px-3 py-1.5 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<p className="text-neutral-500">Loading...</p>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
