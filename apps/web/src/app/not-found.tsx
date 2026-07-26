import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
      <p className="font-display text-6xl italic text-gold-700">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-neutral-900">Page not found</h1>
      <p className="mt-3 text-neutral-600">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-neutral-900 px-8 py-3 text-sm font-medium text-white transition-transform hover:scale-105 hover:bg-gold-700"
      >
        Back to Home
      </Link>
    </div>
  );
}
