"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { apiFetch, ApiError } from "@/lib/api";
import { slugify } from "@/lib/slugify";
import { splitCommaList } from "@/lib/csv";
import { ProductFields, type ProductFormValues } from "@/components/admin/product-fields";
import { VariantsEditor, emptyVariant, type VariantDraft } from "@/components/admin/variants-editor";
import { ImagesEditor, type ImageDraft } from "@/components/admin/images-editor";
import type { Category, Product } from "@/lib/types";

const DEFAULT_VALUES: ProductFormValues = {
  name: "",
  slug: "",
  brand: "Hussain",
  description: "",
  shortDescription: "",
  gender: "UNISEX",
  concentration: "EDP",
  topNotes: "",
  middleNotes: "",
  baseNotes: "",
  occasion: "",
  season: "",
  longevity: "",
  projection: "",
  status: "DRAFT",
  isFeatured: false,
  isTrending: false,
  isNewArrival: false,
  isLimitedEdition: false,
  categoryId: "",
};

export default function NewProductPage() {
  const { authFetch } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [values, setValues] = useState<ProductFormValues>(DEFAULT_VALUES);
  const [slugTouched, setSlugTouched] = useState(false);
  const [variants, setVariants] = useState<VariantDraft[]>([emptyVariant()]);
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<Category[]>("/categories?includeInactive=true").then(setCategories);
  }, []);

  function handleChange<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    if (key === "slug") setSlugTouched(true);
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugTouched) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (variants.length === 0) {
      setError("Add at least one size/variant");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        slug: values.slug,
        brand: values.brand || undefined,
        description: values.description,
        shortDescription: values.shortDescription || undefined,
        gender: values.gender,
        concentration: values.concentration,
        topNotes: splitCommaList(values.topNotes),
        middleNotes: splitCommaList(values.middleNotes),
        baseNotes: splitCommaList(values.baseNotes),
        occasion: splitCommaList(values.occasion),
        season: splitCommaList(values.season),
        longevity: values.longevity || undefined,
        projection: values.projection || undefined,
        status: values.status,
        isFeatured: values.isFeatured,
        isTrending: values.isTrending,
        isNewArrival: values.isNewArrival,
        isLimitedEdition: values.isLimitedEdition,
        categoryId: values.categoryId || undefined,
        images: images.map((img) => ({ url: img.url, altText: img.altText })),
        variants: variants.map((v) => ({
          sku: v.sku,
          volumeMl: Number(v.volumeMl),
          price: Number(v.price),
          salePrice: v.salePrice ? Number(v.salePrice) : undefined,
          stock: Number(v.stock),
          isActive: v.isActive,
        })),
      };

      const product = await authFetch<Product>("/products", { method: "POST", body: payload });
      showToast("Product created");
      router.push(`/admin/products/${product.id}/edit`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create product");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <h2 className="text-lg font-medium text-neutral-900">Add Product</h2>

      <ProductFields values={values} onChange={handleChange} categories={categories} autoSlug />

      <div>
        <h3 className="mb-2 text-sm font-medium text-neutral-900">Images</h3>
        <ImagesEditor images={images} onChange={setImages} />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-neutral-900">Sizes / Variants</h3>
        <VariantsEditor variants={variants} onChange={setVariants} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-700 disabled:opacity-50"
      >
        {isSubmitting ? "Creating..." : "Create Product"}
      </button>
    </form>
  );
}
