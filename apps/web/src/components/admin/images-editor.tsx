"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { ApiError } from "@/lib/api";

export interface ImageDraft {
  key: string;
  id?: string;
  url: string;
  altText?: string;
}

export function ImagesEditor({
  images,
  onChange,
}: {
  images: ImageDraft[];
  onChange: (images: ImageDraft[]) => void;
}) {
  const { uploadFile } = useAuth();
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadFile<{ url: string; publicId: string }>("/uploads/image", file);
      onChange([...images, { key: crypto.randomUUID(), url: result.url }]);
    } catch (error) {
      showToast(
        error instanceof ApiError
          ? `${error.message} — use "Add by URL" below instead`
          : "Upload failed — use \"Add by URL\" below instead",
        "error",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleAddUrl() {
    const url = urlInput.trim();
    if (!url) return;
    onChange([...images, { key: crypto.randomUUID(), url }]);
    setUrlInput("");
  }

  function remove(key: string) {
    onChange(images.filter((img) => img.key !== key));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((image) => (
          <div key={image.key} className="relative h-24 w-24 overflow-hidden rounded border border-neutral-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(image.key)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900/80 text-xs text-white"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-block cursor-pointer rounded border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:border-gold-600">
          {isUploading ? "Uploading..." : "+ Upload Image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
        </label>

        <span className="text-xs text-neutral-400">or</span>

        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste an image URL"
            className="w-64 rounded border border-neutral-300 px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:border-gold-600"
          >
            Add by URL
          </button>
        </div>
      </div>
    </div>
  );
}
