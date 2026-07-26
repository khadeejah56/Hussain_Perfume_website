import Link from "next/link";

const SHOP_LINKS = [
  { label: "All Fragrances", href: "/products" },
  { label: "Men", href: "/products?gender=MEN" },
  { label: "Women", href: "/products?gender=WOMEN" },
  { label: "Unisex", href: "/products?gender=UNISEX" },
];

const ACCOUNT_LINKS = [
  { label: "My Account", href: "/account" },
  { label: "Order History", href: "/account/orders" },
  { label: "Wishlist", href: "/wishlist" },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-gold-900/30 bg-neutral-900 text-neutral-300">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-2">
          <p className="font-display text-xl font-semibold text-white">
            HUSSAIN <span className="font-light italic text-gold-400">Perfumes</span>
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-400">
            Luxury fragrances crafted with rare oud, amber, and floral notes. Each bottle is composed for those who
            consider scent an art form — discover one that stays with you.
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-400">Shop</p>
          <ul className="mt-4 space-y-2 text-sm">
            {SHOP_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-gold-300">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-400">Account</p>
          <ul className="mt-4 space-y-2 text-sm">
            {ACCOUNT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-gold-300">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-neutral-400">
            <a href="mailto:hello@hussainperfumes.com" className="transition-colors hover:text-gold-300">
              hello@hussainperfumes.com
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-neutral-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Hussain Perfumes. All rights reserved.</p>
          <p>Secure checkout &middot; Cash on Delivery &middot; Bank Transfer &middot; Card</p>
        </div>
      </div>
    </footer>
  );
}
