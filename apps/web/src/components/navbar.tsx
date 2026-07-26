"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";

const NAV_LINKS = [
  { label: "All Fragrances", href: "/products" },
  { label: "Men", href: "/products?gender=MEN" },
  { label: "Women", href: "/products?gender=WOMEN" },
  { label: "Unisex", href: "/products?gender=UNISEX" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group relative py-1 text-neutral-700 hover:text-gold-700">
      {label}
      <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gold-700 transition-transform duration-300 group-hover:scale-x-100" />
    </Link>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 8);
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(search.trim() ? `/products?search=${encodeURIComponent(search.trim())}` : "/products");
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <motion.header
      initial={false}
      animate={{
        boxShadow: scrolled ? "0 8px 24px -12px rgba(0,0,0,0.18)" : "0 0px 0px rgba(0,0,0,0)",
      }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 bg-[var(--background)]/90 backdrop-blur"
    >
      <div className="border-b border-gold-900/20 bg-neutral-900 text-center text-[11px] uppercase tracking-[0.25em] text-gold-200">
        <p className="py-2">Complimentary shipping on all orders over $150</p>
      </div>

      <div className="border-b border-gold-800/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="font-display text-2xl font-semibold tracking-wide text-neutral-900 transition-transform hover:scale-[1.02]">
            HUSSAIN <span className="font-light italic text-gold-700">Perfumes</span>
          </Link>

        <nav className="flex flex-wrap items-center gap-5 text-sm">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="hidden md:block">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search perfumes..."
              className="w-48 rounded-full border border-neutral-300 px-4 py-1.5 text-sm transition-all focus:w-56 focus:border-gold-600 focus:outline-none"
            />
          </form>

          {user && (
            <Link href="/wishlist" className="text-sm text-neutral-700 hover:text-gold-700">
              Wishlist
            </Link>
          )}

          <Link href="/cart" className="relative text-sm text-neutral-700 hover:text-gold-700">
            Cart
            <AnimatePresence>
              {!!cart?.itemCount && (
                <motion.span
                  key={cart.itemCount}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="absolute -right-3 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold-700 text-[10px] text-white"
                >
                  {cart.itemCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {user ? (
            <div className="flex items-center gap-3 text-sm">
              <Link href="/account" className="text-neutral-700 hover:text-gold-700">
                {user.firstName}
              </Link>
              <button onClick={handleLogout} className="text-neutral-500 hover:text-gold-700">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <Link href="/login" className="text-neutral-700 hover:text-gold-700">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-neutral-900 px-4 py-1.5 text-white transition-transform hover:scale-105 hover:bg-gold-700"
              >
                Register
              </Link>
            </div>
          )}
        </div>
        </div>
      </div>
    </motion.header>
  );
}
