export function StarRating({ rating, size = "text-base" }: { rating: number; size?: string }) {
  return (
    <span className={`${size} text-gold-600`} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(Math.round(rating))}
      <span className="text-neutral-300">{"★".repeat(5 - Math.round(rating))}</span>
    </span>
  );
}
