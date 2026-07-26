"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { formatPrice } from "@/lib/format";
import { StatCard } from "@/components/admin/stat-card";
import type { OrderStats } from "@/lib/types";

export default function AdminDashboardPage() {
  const { authFetch } = useAuth();
  const [stats, setStats] = useState<OrderStats | null>(null);

  useEffect(() => {
    authFetch<OrderStats>("/orders/admin/stats").then(setStats);
  }, [authFetch]);

  if (!stats) return <p className="text-neutral-500">Loading...</p>;

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-medium text-neutral-900">Dashboard</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Sales" value={formatPrice(stats.totalSales)} accent />
        <StatCard label="Total Orders" value={String(stats.totalOrders)} />
        <StatCard label="Incomplete Sales" value={String(stats.incompleteOrders)} />
        <StatCard label="Processing" value={String(stats.processingOrders)} />
        <StatCard label="Dispatched" value={String(stats.dispatchedOrders)} />
        <StatCard label="Delivered" value={String(stats.deliveredOrders)} />
        <StatCard label="Returns / Refunds" value={String(stats.returnedOrders)} />
        <StatCard label="Cancelled" value={String(stats.cancelledOrders)} />
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/admin/orders?status=PENDING" className="text-gold-700 hover:underline">
          View incomplete sales →
        </Link>
        <Link href="/admin/orders?status=RETURNED" className="text-gold-700 hover:underline">
          View returns →
        </Link>
        <Link href="/admin/products" className="text-gold-700 hover:underline">
          Manage products →
        </Link>
      </div>
    </div>
  );
}
