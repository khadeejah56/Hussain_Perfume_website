import type { OrderStatus, PaymentStatus } from "@/lib/types";

const ORDER_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-neutral-100 text-neutral-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  PACKED: "bg-blue-50 text-blue-700",
  SHIPPED: "bg-indigo-50 text-indigo-700",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
  RETURNED: "bg-gold-50 text-gold-700",
  REFUNDED: "bg-gold-50 text-gold-700",
};

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  PENDING: "bg-neutral-100 text-neutral-700",
  PAID: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-700",
  REFUNDED: "bg-gold-50 text-gold-700",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ORDER_COLORS[status]}`}>{status}</span>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PAYMENT_COLORS[status]}`}>{status}</span>;
}
