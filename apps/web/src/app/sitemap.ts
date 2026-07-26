import type { MetadataRoute } from "next";
import { apiFetch } from "@/lib/api";
import type { PaginatedResponse, Product } from "@/lib/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/login`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/register`, changeFrequency: "yearly", priority: 0.2 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const result = await apiFetch<PaginatedResponse<Product>>("/products?limit=100");
    productRoutes = result.data.map((product) => ({
      url: `${siteUrl}/products/${product.slug}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    // If the API is unreachable at build time, ship the sitemap without product routes.
  }

  return [...staticRoutes, ...productRoutes];
}
