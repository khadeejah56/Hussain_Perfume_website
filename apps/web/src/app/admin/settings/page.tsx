"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { apiFetch, ApiError } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";

export default function AdminSettingsPage() {
  const { authFetch } = useAuth();
  const { showToast } = useToast();
  const [bannerText, setBannerText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    apiFetch<SiteSettings>("/settings")
      .then((data) => setBannerText(data.shippingBannerText))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await authFetch("/settings", { method: "PATCH", body: { shippingBannerText: bannerText } });
      showToast("Settings saved");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not save settings", "error");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-neutral-500">Loading...</p>;

  return (
    <div>
      <h2 className="mb-6 text-lg font-medium text-neutral-900">Settings</h2>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Announcement Bar Text
          </label>
          <input
            value={bannerText}
            onChange={(e) => setBannerText(e.target.value)}
            maxLength={300}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-neutral-400">
            Shown in the thin gold bar at the top of every page (e.g. shipping offer).
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
