import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Category, PaginatedResponse, Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { Hero } from "@/components/hero";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGrid, StaggerItem } from "@/components/motion/stagger-grid";

async function safeFetchProducts(query: string): Promise<Product[]> {
  try {
    const result = await apiFetch<PaginatedResponse<Product>>(`/products?${query}`, { cache: "no-store" });
    return result.data;
  } catch {
    return [];
  }
}

async function safeFetchCategories(): Promise<Category[]> {
  try {
    return await apiFetch<Category[]>("/categories", { cache: "no-store" });
  } catch {
    return [];
  }
}

function ProductSection({
  title,
  products,
  viewAllHref,
}: {
  title: string;
  products: Product[];
  viewAllHref: string;
}) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <FadeIn className="mb-6 flex items-end justify-between">
        <div>
          <div className="mb-2 h-px w-10 bg-gold-600" />
          <h2 className="font-display text-2xl font-semibold text-neutral-900">{title}</h2>
        </div>
        <Link href={viewAllHref} className="text-sm text-gold-700 hover:underline">
          View all
        </Link>
      </FadeIn>
      <StaggerGrid className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <StaggerItem key={product.id}>
            <ProductCard product={product} />
          </StaggerItem>
        ))}
      </StaggerGrid>
    </section>
  );
}

export default async function HomePage() {
  const [featured, trending, newArrivals, categories] = await Promise.all([
    safeFetchProducts("isFeatured=true&limit=8"),
    safeFetchProducts("isTrending=true&limit=8"),
    safeFetchProducts("isNewArrival=true&limit=8"),
    safeFetchCategories(),
  ]);

  return (
    <div>
      <Hero />

      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <FadeIn className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?categorySlug=${category.slug}`}
                className="rounded-full border border-neutral-300 px-6 py-2 text-sm text-neutral-700 transition-all hover:scale-105 hover:border-gold-700 hover:text-gold-700"
              >
                {category.name}
              </Link>
            ))}
          </FadeIn>
        </section>
      )}

      <ProductSection title="Featured" products={featured} viewAllHref="/products?isFeatured=true" />
      <ProductSection title="Trending Now" products={trending} viewAllHref="/products?isTrending=true" />
      <ProductSection title="New Arrivals" products={newArrivals} viewAllHref="/products?isNewArrival=true" />

      {featured.length === 0 && trending.length === 0 && newArrivals.length === 0 && (
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-neutral-500">
          No products to show yet — check back soon.
        </div>
      )}
    </div>
  );
}
