import { ProductCardSkeleton } from "@/components/product-card-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="skeleton mb-8 h-8 w-64 rounded" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <div className="hidden lg:block" />
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
