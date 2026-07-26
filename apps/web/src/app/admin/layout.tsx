"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequireAdmin } from "@/components/require-admin";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RequireAdmin>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold text-neutral-900">Admin</h1>
          <nav className="flex gap-4 text-sm">
            {LINKS.map((link) => {
              const isActive = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={isActive ? "font-medium text-gold-700" : "text-neutral-600 hover:text-gold-700"}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        {children}
      </div>
    </RequireAdmin>
  );
}
