import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import type { Product } from "@/lib/types";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
import { ReviewsSection } from "@/components/reviews-section";

async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    return await apiFetch<Product>(`/products/${slug}`, { cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ProductPurchasePanel product={product} />
      </div>
      <ReviewsSection productId={product.id} />
    </div>
  );
}
