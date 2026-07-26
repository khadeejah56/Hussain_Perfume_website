"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { apiFetch, ApiError } from "@/lib/api";
import { splitCommaList, joinCommaList } from "@/lib/csv";
import { ProductFields, type ProductFormValues } from "@/components/admin/product-fields";
import { VariantsEditor, type VariantDraft } from "@/components/admin/variants-editor";
import { ImagesEditor, type ImageDraft } from "@/components/admin/images-editor";
import type { Category, Product } from "@/lib/types";

function toValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    description: product.description,
    shortDescription: product.shortDescription ?? "",
    gender: product.gender,
    concentration: product.concentration,
    topNotes: joinCommaList(product.topNotes),
    middleNotes: joinCommaList(product.middleNotes),
    baseNotes: joinCommaList(product.baseNotes),
    occasion: joinCommaList(product.occasion),
    season: joinCommaList(product.season),
    longevity: product.longevity ?? "",
    projection: product.projection ?? "",
    status: product.status,
    isFeatured: product.isFeatured,
    isTrending: product.isTrending,
    isNewArrival: product.isNewArrival,
    isLimitedEdition: product.isLimitedEdition,
    categoryId: product.categoryId ?? "",
  };
}

function toVariantDrafts(product: Product): VariantDraft[] {
  return product.variants.map((v) => ({
    key: v.id,
    id: v.id,
    sku: v.sku,
    volumeMl: String(v.volumeMl),
    price: v.price,
    salePrice: v.salePrice ?? "",
    stock: String(v.stock),
    isActive: v.isActive,
  }));
}

function toImageDrafts(product: Product): ImageDraft[] {
  return [...product.images]
    .sort((a, b) => a.position - b.position)
    .map((img) => ({ key: img.id, id: img.id, url: img.url, altText: img.altText ?? undefined }));
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { authFetch } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [values, setValues] = useState<ProductFormValues | null>(null);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [images, setImages] = useState<ImageDraft[]>([]);

  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isSavingVariants, setIsSavingVariants] = useState(false);
  const [isSavingImages, setIsSavingImages] = useState(false);

  function load() {
    authFetch<Product>(`/products/id/${id}`).then((data) => {
      setProduct(data);
      setValues(toValues(data));
      setVariants(toVariantDrafts(data));
      setImages(toImageDrafts(data));
    });
  }

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    apiFetch<Category[]>("/categories?includeInactive=true").then(setCategories);
  }, []);

  function handleChange<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!values) return;
    setDetailsError(null);
    setIsSavingDetails(true);
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
      };
      await authFetch<Product>(`/products/${id}`, { method: "PATCH", body: payload });
      showToast("Product details saved");
    } catch (err) {
      setDetailsError(err instanceof ApiError ? err.message : "Could not save product");
    } finally {
      setIsSavingDetails(false);
    }
  }

  async function handleSaveVariants() {
    if (!product) return;
    setIsSavingVariants(true);
    try {
      const originalIds = new Set(product.variants.map((v) => v.id));
      const currentIds = new Set(variants.filter((v) => v.id).map((v) => v.id));

      for (const variant of variants) {
        const body = {
          sku: variant.sku,
          volumeMl: Number(variant.volumeMl),
          price: Number(variant.price),
          salePrice: variant.salePrice ? Number(variant.salePrice) : undefined,
          stock: Number(variant.stock),
          isActive: variant.isActive,
        };
        if (variant.id) {
          await authFetch(`/products/variants/${variant.id}`, { method: "PATCH", body });
        } else {
          await authFetch(`/products/${id}/variants`, { method: "POST", body });
        }
      }

      for (const originalId of originalIds) {
        if (!currentIds.has(originalId)) {
          await authFetch(`/products/variants/${originalId}`, { method: "DELETE" });
        }
      }

      showToast("Variants saved");
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not save variants", "error");
    } finally {
      setIsSavingVariants(false);
    }
  }

  async function handleSaveImages() {
    if (!product) return;
    setIsSavingImages(true);
    try {
      const originalIds = new Set(product.images.map((img) => img.id));
      const currentIds = new Set(images.filter((img) => img.id).map((img) => img.id));

      for (const originalId of originalIds) {
        if (!currentIds.has(originalId)) {
          await authFetch(`/products/images/${originalId}`, { method: "DELETE" });
        }
      }

      for (let index = 0; index < images.length; index++) {
        const image = images[index];
        if (!image.id) {
          await authFetch(`/products/${id}/images`, {
            method: "POST",
            body: { url: image.url, altText: image.altText, position: index },
          });
        }
      }

      showToast("Images saved");
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not save images", "error");
    } finally {
      setIsSavingImages(false);
    }
  }

  async function handleDeleteProduct() {
    if (!product || !confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await authFetch(`/products/${id}`, { method: "DELETE" });
      showToast("Product deleted");
      router.push("/admin/products");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not delete product", "error");
    }
  }

  if (!values || !product) {
    return <p className="text-neutral-500">Loading...</p>;
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-neutral-900">Edit Product</h2>
        <button onClick={handleDeleteProduct} className="text-sm text-red-600 hover:underline">
          Delete Product
        </button>
      </div>

      <form onSubmit={handleSaveDetails} className="space-y-6">
        <ProductFields values={values} onChange={handleChange} categories={categories} />
        {detailsError && <p className="text-sm text-red-600">{detailsError}</p>}
        <button
          type="submit"
          disabled={isSavingDetails}
          className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-700 disabled:opacity-50"
        >
          {isSavingDetails ? "Saving..." : "Save Details"}
        </button>
      </form>

      <div>
        <h3 className="mb-2 text-sm font-medium text-neutral-900">Images</h3>
        <ImagesEditor images={images} onChange={setImages} />
        <button
          onClick={handleSaveImages}
          disabled={isSavingImages}
          className="mt-3 rounded-full border border-neutral-300 px-5 py-2 text-sm hover:border-gold-600 disabled:opacity-50"
        >
          {isSavingImages ? "Saving..." : "Save Images"}
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-neutral-900">Sizes / Variants</h3>
        <VariantsEditor variants={variants} onChange={setVariants} />
        <button
          onClick={handleSaveVariants}
          disabled={isSavingVariants}
          className="mt-3 rounded-full border border-neutral-300 px-5 py-2 text-sm hover:border-gold-600 disabled:opacity-50"
        >
          {isSavingVariants ? "Saving..." : "Save Variants"}
        </button>
      </div>
    </div>
  );
}
