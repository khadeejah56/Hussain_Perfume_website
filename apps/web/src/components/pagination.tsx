import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <nav className="flex items-center justify-center gap-2 py-10 text-sm">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        className={`rounded border px-3 py-1.5 ${page === 1 ? "pointer-events-none text-neutral-300" : "hover:border-gold-700"}`}
      >
        Prev
      </Link>
      {pages.map((p, idx) => (
        <span key={p} className="flex items-center gap-2">
          {idx > 0 && pages[idx - 1] !== p - 1 && <span className="text-neutral-400">…</span>}
          <Link
            href={buildHref(p)}
            className={`rounded border px-3 py-1.5 ${p === page ? "border-gold-700 bg-gold-700 text-white" : "hover:border-gold-700"}`}
          >
            {p}
          </Link>
        </span>
      ))}
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        className={`rounded border px-3 py-1.5 ${page === totalPages ? "pointer-events-none text-neutral-300" : "hover:border-gold-700"}`}
      >
        Next
      </Link>
    </nav>
  );
}
