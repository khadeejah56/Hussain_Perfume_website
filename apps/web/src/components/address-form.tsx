"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import type { Address } from "@/lib/types";

export interface AddressFormValues {
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export function AddressForm({
  initial,
  onSubmit,
  submitLabel = "Save Address",
}: {
  initial?: Partial<Address>;
  onSubmit: (values: AddressFormValues) => Promise<void>;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<AddressFormValues>({
    label: initial?.label ?? "Home",
    fullName: initial?.fullName ?? "",
    phone: initial?.phone ?? "",
    line1: initial?.line1 ?? "",
    line2: initial?.line2 ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    postalCode: initial?.postalCode ?? "",
    country: initial?.country ?? "",
    isDefault: initial?.isDefault ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof AddressFormValues>(key: K, value: AddressFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          required
          placeholder="Label (e.g. Home)"
          value={values.label}
          onChange={(e) => update("label", e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
        <input
          required
          placeholder="Full name"
          value={values.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </div>
      <input
        required
        placeholder="Phone"
        value={values.phone}
        onChange={(e) => update("phone", e.target.value)}
        className="w-full rounded border border-neutral-300 px-3 py-2"
      />
      <input
        required
        placeholder="Address line 1"
        value={values.line1}
        onChange={(e) => update("line1", e.target.value)}
        className="w-full rounded border border-neutral-300 px-3 py-2"
      />
      <input
        placeholder="Address line 2 (optional)"
        value={values.line2}
        onChange={(e) => update("line2", e.target.value)}
        className="w-full rounded border border-neutral-300 px-3 py-2"
      />
      <div className="grid grid-cols-3 gap-3">
        <input
          required
          placeholder="City"
          value={values.city}
          onChange={(e) => update("city", e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
        <input
          placeholder="State"
          value={values.state}
          onChange={(e) => update("state", e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
        <input
          required
          placeholder="Postal code"
          value={values.postalCode}
          onChange={(e) => update("postalCode", e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </div>
      <input
        required
        placeholder="Country"
        value={values.country}
        onChange={(e) => update("country", e.target.value)}
        className="w-full rounded border border-neutral-300 px-3 py-2"
      />
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" checked={values.isDefault} onChange={(e) => update("isDefault", e.target.checked)} />
        Set as default address
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-neutral-900 px-5 py-2 text-sm text-white hover:bg-gold-700 disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
