import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Category, Concentration, Gender, PaginatedResponse, Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGrid, StaggerItem } from "@/components/motion/stagger-grid";

type SearchParams = Record<string, string | undefined>;

const GENDERS: { label: string; value: Gender }[] = [
  { label: "Men", value: "MEN" },
  { label: "Women", value: "WOMEN" },
  { label: "Unisex", value: "UNISEX" },
];

const CONCENTRATIONS: { label: string; value: Concentration }[] = [
  { label: "Eau de Cologne", value: "EDC" },
  { label: "Eau de Toilette", value: "EDT" },
  { label: "Eau de Parfum", value: "EDP" },
  { label: "Parfum", value: "PARFUM" },
  { label: "Oil", value: "OIL" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Name: A-Z", value: "name_asc" },
  { label: "Name: Z-A", value: "name_desc" },
];

function buildQuery(params: SearchParams, overrides: SearchParams): string {
  const merged: SearchParams = { ...params, ...overrides };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `/products?${qs}` : "/products";
}

async function fetchCategories(): Promise<Category[]> {
  try {
    return await apiFetch<Category[]>("/categories", { cache: "no-store" });
  } catch {
    return [];
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const categories = await fetchCategories();

  const apiQuery = new URLSearchParams();
  if (params.categorySlug) apiQuery.set("categorySlug", params.categorySlug);
  if (params.gender) apiQuery.set("gender", params.gender);
  if (params.concentration) apiQuery.set("concentration", params.concentration);
  if (params.search) apiQuery.set("search", params.search);
  if (params.minPrice) apiQuery.set("minPrice", params.minPrice);
  if (params.maxPrice) apiQuery.set("maxPrice", params.maxPrice);
  if (params.isFeatured) apiQuery.set("isFeatured", params.isFeatured);
  if (params.isTrending) apiQuery.set("isTrending", params.isTrending);
  if (params.isNewArrival) apiQuery.set("isNewArrival", params.isNewArrival);
  apiQuery.set("sortBy", params.sortBy ?? "newest");
  apiQuery.set("page", params.page ?? "1");
  apiQuery.set("limit", "12");

  let result: PaginatedResponse<Product> = { data: [], meta: { page: 1, limit: 12, total: 0, totalPages: 1 } };
  try {
    result = await apiFetch<PaginatedResponse<Product>>(`/products?${apiQuery.toString()}`, { cache: "no-store" });
  } catch {
    // Fall back to empty result if the API is unreachable.
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <FadeIn>
        <h1 className="mb-8 font-display text-3xl font-semibold text-neutral-900">
          {params.search ? `Results for "${params.search}"` : "Shop All Fragrances"}
        </h1>
      </FadeIn>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-8 text-sm">
          <div>
            <h2 className="mb-3 font-semibold text-neutral-900">Category</h2>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href={buildQuery(params, { categorySlug: undefined, page: undefined })}
                  className={!params.categorySlug ? "font-medium text-gold-700" : "text-neutral-600 hover:text-gold-700"}
                >
                  All
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={buildQuery(params, { categorySlug: category.slug, page: undefined })}
                    className={
                      params.categorySlug === category.slug
                        ? "font-medium text-gold-700"
                        : "text-neutral-600 hover:text-gold-700"
                    }
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-neutral-900">Gender</h2>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href={buildQuery(params, { gender: undefined, page: undefined })}
                  className={!params.gender ? "font-medium text-gold-700" : "text-neutral-600 hover:text-gold-700"}
                >
                  All
                </Link>
              </li>
              {GENDERS.map((g) => (
                <li key={g.value}>
                  <Link
                    href={buildQuery(params, { gender: g.value, page: undefined })}
                    className={params.gender === g.value ? "font-medium text-gold-700" : "text-neutral-600 hover:text-gold-700"}
                  >
                    {g.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-neutral-900">Concentration</h2>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href={buildQuery(params, { concentration: undefined, page: undefined })}
                  className={!params.concentration ? "font-medium text-gold-700" : "text-neutral-600 hover:text-gold-700"}
                >
                  All
                </Link>
              </li>
              {CONCENTRATIONS.map((c) => (
                <li key={c.value}>
                  <Link
                    href={buildQuery(params, { concentration: c.value, page: undefined })}
                    className={
                      params.concentration === c.value ? "font-medium text-gold-700" : "text-neutral-600 hover:text-gold-700"
                    }
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-neutral-900">Price Range</h2>
            <form action="/products" method="get" className="flex items-center gap-2">
              {Object.entries(params)
                .filter(([key]) => key !== "minPrice" && key !== "maxPrice" && key !== "page")
                .map(([key, value]) =>
                  value ? <input key={key} type="hidden" name={key} value={value} /> : null,
                )}
              <input
                type="number"
                name="minPrice"
                defaultValue={params.minPrice}
                placeholder="Min"
                className="w-full rounded border border-neutral-300 px-2 py-1"
              />
              <span className="text-neutral-400">–</span>
              <input
                type="number"
                name="maxPrice"
                defaultValue={params.maxPrice}
                placeholder="Max"
                className="w-full rounded border border-neutral-300 px-2 py-1"
              />
              <button type="submit" className="rounded border border-neutral-300 px-2 py-1 hover:border-gold-700">
                Go
              </button>
            </form>
          </div>
        </aside>

        <div>
          <div className="mb-6 flex items-center justify-end gap-2 text-sm">
            <span className="text-neutral-500">Sort:</span>
            {SORT_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={buildQuery(params, { sortBy: opt.value, page: undefined })}
                className={
                  (params.sortBy ?? "newest") === opt.value
                    ? "font-medium text-gold-700"
                    : "text-neutral-600 hover:text-gold-700"
                }
              >
                {opt.label}
              </Link>
            ))}
          </div>

          {result.data.length === 0 ? (
            <p className="py-16 text-center text-neutral-500">No products match your filters.</p>
          ) : (
            <StaggerGrid className="grid grid-cols-2 gap-5 sm:grid-cols-3">
              {result.data.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </StaggerGrid>
          )}

          <Pagination
            page={result.meta.page}
            totalPages={result.meta.totalPages}
            buildHref={(page) => buildQuery(params, { page: String(page) })}
          />
        </div>
      </div>
    </div>
  );
}
