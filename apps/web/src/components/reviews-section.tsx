"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { formatDate } from "@/lib/format";
import { StarRating } from "./star-rating";
import { FadeIn } from "./motion/fade-in";
import { StaggerGrid, StaggerItem } from "./motion/stagger-grid";
import type { Review } from "@/lib/types";

export function ReviewsSection({ productId }: { productId: string }) {
  const { user, authFetch } = useAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitState, setSubmitState] = useState<{ type: "idle" | "success"; message?: string }>({
    type: "idle",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<Review[]>(`/reviews/product/${productId}`)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setIsLoading(false));
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitState({ type: "idle" });
    try {
      await authFetch("/reviews", { method: "POST", body: { productId, rating, title: title || undefined, comment } });
      setSubmitState({ type: "success", message: "Thanks! Your review is pending approval." });
      setTitle("");
      setComment("");
    } catch {
      showToast("Could not submit your review", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <FadeIn>
        <h2 className="mb-6 font-display text-2xl font-semibold text-neutral-900">Customer Reviews</h2>
      </FadeIn>

      {isLoading ? (
        <p className="text-neutral-500">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-neutral-500">No reviews yet. Be the first to share your experience.</p>
      ) : (
        <StaggerGrid className="space-y-6">
          {reviews.map((review) => (
            <StaggerItem key={review.id} className="border-b border-neutral-200 pb-6">
              <div className="flex items-center gap-3">
                <StarRating rating={review.rating} />
                {review.isVerified && (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                    Verified Purchase
                  </span>
                )}
              </div>
              {review.title && <p className="mt-2 font-medium text-neutral-900">{review.title}</p>}
              <p className="mt-1 text-neutral-600">{review.comment}</p>
              <p className="mt-2 text-xs text-neutral-400">
                {review.user ? `${review.user.firstName} ${review.user.lastName.charAt(0)}.` : "Anonymous"} ·{" "}
                {formatDate(review.createdAt)}
              </p>
              {review.adminReply && (
                <p className="mt-2 rounded bg-neutral-50 p-3 text-sm text-neutral-600">
                  <span className="font-medium text-neutral-900">Hussain Perfumes: </span>
                  {review.adminReply}
                </p>
              )}
            </StaggerItem>
          ))}
        </StaggerGrid>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="mt-8 max-w-lg space-y-3 rounded-lg border border-neutral-200 p-5">
          <h3 className="font-medium text-neutral-900">Write a review</h3>
          <div>
            <label className="mb-1 block text-sm text-neutral-700">Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="rounded border border-neutral-300 px-3 py-1.5"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} star{r > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full rounded border border-neutral-300 px-3 py-1.5"
          />
          <textarea
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            className="w-full rounded border border-neutral-300 px-3 py-1.5"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-neutral-900 px-5 py-2 text-sm text-white hover:bg-gold-700 disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
          {submitState.type === "success" && <p className="text-sm text-green-700">{submitState.message}</p>}
        </form>
      ) : (
        <p className="mt-6 text-sm text-neutral-500">
          <a href="/login" className="text-gold-700 hover:underline">
            Log in
          </a>{" "}
          to write a review.
        </p>
      )}
    </section>
  );
}
