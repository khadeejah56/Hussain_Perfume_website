"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { formatPrice } from "@/lib/format";
import { getPriceRange, getPrimaryImage, getTotalStock } from "@/lib/product-helpers";
import type { PaginatedResponse, Product, ProductStatus } from "@/lib/types";

const STATUS_STYLES: Record<ProductStatus, string> = {
  DRAFT: "bg-neutral-100 text-neutral-600",
  PUBLISHED: "bg-green-50 text-green-700",
  HIDDEN: "bg-amber-50 text-amber-700",
};

export default function AdminProductsPage() {
  const { authFetch } = useAuth();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResponse<Product> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function load() {
    setIsLoading(true);
    authFetch<PaginatedResponse<Product>>(`/products/admin?page=${page}&limit=20`)
      .then(setResult)
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await authFetch(`/products/${product.id}`, { method: "DELETE" });
      showToast("Product deleted");
      load();
    } catch {
      showToast("Could not delete product", "error");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-medium text-neutral-900">Products</h2>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-700"
        >
          + Add Product
        </Link>
      </div>

      {isLoading ? (
        <p className="text-neutral-500">Loading...</p>
      ) : !result || result.data.length === 0 ? (
        <p className="text-neutral-500">No products yet. Add your first one.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {result.data.map((product) => {
                  const image = getPrimaryImage(product);
                  const priceRange = getPriceRange(product);
                  const stock = getTotalStock(product);
                  return (
                    <tr key={product.id}>
                      <td className="flex items-center gap-3 px-4 py-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-neutral-100">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{product.name}</p>
                          <p className="text-xs text-neutral-500">{product.brand}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[product.status]}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {priceRange
                          ? priceRange.min === priceRange.max
                            ? formatPrice(priceRange.min)
                            : `${formatPrice(priceRange.min)} – ${formatPrice(priceRange.max)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{stock}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/products/${product.id}/edit`} className="text-gold-700 hover:underline">
                          Edit
                        </Link>
                        <button onClick={() => handleDelete(product)} className="ml-4 text-red-600 hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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
    </div>
  );
}
