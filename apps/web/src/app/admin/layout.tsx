"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequireAdmin } from "@/components/require-admin";

const LINKS = [{ href: "/admin/products", label: "Products" }];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RequireAdmin>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold text-neutral-900">Admin</h1>
          <nav className="flex gap-4 text-sm">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={pathname.startsWith(link.href) ? "font-medium text-gold-700" : "text-neutral-600 hover:text-gold-700"}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        {children}
      </div>
    </RequireAdmin>
  );
}
