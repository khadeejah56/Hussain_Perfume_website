"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export function Hero() {
  return (
    <section className="bg-noise relative overflow-hidden border-b border-gold-900/30 bg-neutral-900 text-white">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-700/30 blur-[120px]"
        />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-6xl px-4 py-28 text-center sm:py-36"
      >
        <motion.p variants={item} className="text-sm uppercase tracking-[0.35em] text-gold-500">
          Hussain Perfumes
        </motion.p>
        <motion.div variants={item} className="mx-auto mt-4 h-px w-16 bg-gold-700/60" />
        <motion.h1 variants={item} className="mt-6 font-display text-5xl font-medium sm:text-6xl">
          A scent that stays with you
        </motion.h1>
        <motion.p variants={item} className="mx-auto mt-5 max-w-xl text-neutral-300">
          Luxury fragrances crafted with rare oud, amber, and floral notes — for every occasion, every season.
        </motion.p>
        <motion.div variants={item}>
          <Link
            href="/products"
            className="mt-9 inline-block rounded-full bg-gold-700 px-8 py-3 text-sm font-medium text-white transition-transform hover:scale-105 hover:bg-gold-600"
          >
            Shop the Collection
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
