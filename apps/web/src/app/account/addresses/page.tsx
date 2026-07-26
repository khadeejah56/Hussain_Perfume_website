"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { AddressForm, type AddressFormValues } from "@/components/address-form";
import { FadeIn } from "@/components/motion/fade-in";
import type { Address } from "@/lib/types";

export default function AddressesPage() {
  const { authFetch } = useAuth();
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    authFetch<Address[]>("/addresses")
      .then(setAddresses)
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(values: AddressFormValues) {
    await authFetch("/addresses", { method: "POST", body: values });
    setShowForm(false);
    showToast("Address added");
    load();
  }

  async function handleUpdate(id: string, values: AddressFormValues) {
    await authFetch(`/addresses/${id}`, { method: "PATCH", body: values });
    setEditingId(null);
    showToast("Address updated");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this address?")) return;
    await authFetch(`/addresses/${id}`, { method: "DELETE" });
    showToast("Address deleted");
    load();
  }

  return (
    <FadeIn>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-neutral-900">Addresses</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="text-sm text-gold-700 hover:underline">
            + Add Address
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 max-w-md rounded border border-neutral-200 p-4">
          <AddressForm onSubmit={handleCreate} submitLabel="Add Address" />
          <button onClick={() => setShowForm(false)} className="mt-3 text-sm text-neutral-500 hover:underline">
            Cancel
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-neutral-500">Loading...</p>
      ) : addresses.length === 0 ? (
        <p className="text-neutral-500">No saved addresses yet.</p>
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) =>
            editingId === address.id ? (
              <li key={address.id} className="max-w-md rounded border border-neutral-200 p-4">
                <AddressForm initial={address} onSubmit={(values) => handleUpdate(address.id, values)} submitLabel="Save" />
                <button onClick={() => setEditingId(null)} className="mt-3 text-sm text-neutral-500 hover:underline">
                  Cancel
                </button>
              </li>
            ) : (
              <li key={address.id} className="max-w-md rounded border border-neutral-200 p-4 text-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">
                      {address.label} {address.isDefault && <span className="text-xs text-gold-700">(Default)</span>}
                    </p>
                    <p className="text-neutral-600">{address.fullName}</p>
                    <p className="text-neutral-600">{address.phone}</p>
                    <p className="text-neutral-600">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}, {address.city}
                      {address.state ? `, ${address.state}` : ""} {address.postalCode}, {address.country}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-3 text-xs">
                    <button onClick={() => setEditingId(address.id)} className="text-gold-700 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(address.id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </FadeIn>
  );
}
