"use client";

import type { Category, Concentration, Gender, ProductStatus } from "@/lib/types";

export interface ProductFormValues {
  name: string;
  slug: string;
  brand: string;
  description: string;
  shortDescription: string;
  gender: Gender;
  concentration: Concentration;
  topNotes: string;
  middleNotes: string;
  baseNotes: string;
  occasion: string;
  season: string;
  longevity: string;
  projection: string;
  status: ProductStatus;
  isFeatured: boolean;
  isTrending: boolean;
  isNewArrival: boolean;
  isLimitedEdition: boolean;
  categoryId: string;
}

const GENDERS: Gender[] = ["MEN", "WOMEN", "UNISEX"];
const CONCENTRATIONS: Concentration[] = ["EDC", "EDT", "EDP", "PARFUM", "OIL"];
const STATUSES: ProductStatus[] = ["DRAFT", "PUBLISHED", "HIDDEN"];

const FLAGS: { key: keyof ProductFormValues; label: string }[] = [
  { key: "isFeatured", label: "Featured" },
  { key: "isTrending", label: "Trending" },
  { key: "isNewArrival", label: "New Arrival" },
  { key: "isLimitedEdition", label: "Limited Edition" },
];

export function ProductFields({
  values,
  onChange,
  categories,
  autoSlug = false,
}: {
  values: ProductFormValues;
  onChange: <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => void;
  categories: Category[];
  autoSlug?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Name</label>
          <input
            required
            value={values.name}
            onChange={(e) => onChange("name", e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Slug {autoSlug && <span className="text-xs text-neutral-400">(auto-generated, editable)</span>}
          </label>
          <input
            required
            value={values.slug}
            onChange={(e) => onChange("slug", e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Brand</label>
          <input
            value={values.brand}
            onChange={(e) => onChange("brand", e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Gender</label>
          <select
            value={values.gender}
            onChange={(e) => onChange("gender", e.target.value as Gender)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
          >
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Concentration</label>
          <select
            value={values.concentration}
            onChange={(e) => onChange("concentration", e.target.value as Concentration)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
          >
            {CONCENTRATIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Description</label>
        <textarea
          required
          rows={3}
          value={values.description}
          onChange={(e) => onChange("description", e.target.value)}
          className="w-full rounded border border-neutral-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Short Description</label>
        <input
          value={values.shortDescription}
          onChange={(e) => onChange("shortDescription", e.target.value)}
          className="w-full rounded border border-neutral-300 px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Top Notes (comma separated)</label>
          <input
            value={values.topNotes}
            onChange={(e) => onChange("topNotes", e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Middle Notes</label>
          <input
            value={values.middleNotes}
            onChange={(e) => onChange("middleNotes", e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Base Notes</label>
          <input
            value={values.baseNotes}
            onChange={(e) => onChange("baseNotes", e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Occasion (comma separated)</label>
          <input
            value={values.occasion}
            onChange={(e) => onChange("occasion", e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Season</label>
          <input
            value={values.season}
            onChange={(e) => onChange("season", e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Longevity</label>
          <input
            value={values.longevity}
            onChange={(e) => onChange("longevity", e.target.value)}
            placeholder="e.g. 8-10 hours"
            className="w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Projection</label>
          <input
            value={values.projection}
            onChange={(e) => onChange("projection", e.target.value)}
            placeholder="e.g. Strong"
            className="w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Category</label>
          <select
            value={values.categoryId}
            onChange={(e) => onChange("categoryId", e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Status</label>
          <select
            value={values.status}
            onChange={(e) => onChange("status", e.target.value as ProductStatus)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">Flags</label>
        <div className="flex flex-wrap gap-4">
          {FLAGS.map((flag) => (
            <label key={flag.key} className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={values[flag.key] as boolean}
                onChange={(e) => onChange(flag.key, e.target.checked as ProductFormValues[typeof flag.key])}
              />
              {flag.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
