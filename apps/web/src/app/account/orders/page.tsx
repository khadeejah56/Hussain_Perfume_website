"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { formatDate, formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGrid, StaggerItem } from "@/components/motion/stagger-grid";
import type { Order, PaginatedResponse } from "@/lib/types";

export default function OrdersPage() {
  const { authFetch } = useAuth();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResponse<Order> | null>(null);

  useEffect(() => {
    authFetch<PaginatedResponse<Order>>(`/orders?page=${page}&limit=10`).then(setResult);
  }, [authFetch, page]);

  return (
    <FadeIn>
      <h1 className="mb-6 font-display text-2xl font-semibold text-neutral-900">Your Orders</h1>

      {!result ? (
        <p className="text-neutral-500">Loading...</p>
      ) : result.data.length === 0 ? (
        <p className="text-neutral-500">You haven&apos;t placed any orders yet.</p>
      ) : (
        <>
          <StaggerGrid className="divide-y divide-neutral-200 border-y border-neutral-200">
            {result.data.map((order) => (
              <StaggerItem key={order.id} className="flex items-center justify-between py-4 text-sm">
                <div>
                  <Link href={`/account/orders/${order.id}`} className="font-medium text-neutral-900 hover:text-gold-700">
                    {order.orderNumber}
                  </Link>
                  <p className="text-neutral-500">{formatDate(order.createdAt)}</p>
                </div>
                <OrderStatusBadge status={order.status} />
                <p className="font-medium text-neutral-900">{formatPrice(order.totalAmount)}</p>
              </StaggerItem>
            ))}
          </StaggerGrid>

          <div className="mt-6 flex justify-center gap-3 text-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border px-3 py-1.5 disabled:opacity-30"
            >
              Prev
            </button>
            <span className="py-1.5">
              Page {result.meta.page} of {result.meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(result.meta.totalPages, p + 1))}
              disabled={page === result.meta.totalPages}
              className="rounded border px-3 py-1.5 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </>
      )}
    </FadeIn>
  );
}
