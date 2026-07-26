import { ProductCardSkeleton } from "@/components/product-card-skeleton";

export default function Loading() {
  return (
    <div>
      <div className="skeleton h-[420px] w-full" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
