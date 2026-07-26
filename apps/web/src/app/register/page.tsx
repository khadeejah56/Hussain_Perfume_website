"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import { FadeIn } from "@/components/motion/fade-in";

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register({ firstName, lastName, email, phone: phone || undefined, password });
      router.push(redirect);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FadeIn className="mx-auto max-w-sm px-4 py-20">
      <h1 className="mb-6 font-display text-3xl font-semibold text-neutral-900">Create an Account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded border border-neutral-300 px-3 py-2"
          />
          <input
            required
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-neutral-300 px-3 py-2"
        />
        <input
          placeholder="Phone (optional, e.g. +923001234567)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded border border-neutral-300 px-3 py-2"
        />
        <div>
          <input
            required
            type="password"
            minLength={8}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-neutral-400">
            At least 8 characters with one uppercase letter, one lowercase letter, and one number.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-700 disabled:opacity-50"
        >
          {isSubmitting ? "Creating account..." : "Register"}
        </motion.button>
      </form>
      <p className="mt-6 text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href={`/login${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="text-gold-700 hover:underline">
          Log In
        </Link>
      </p>
    </FadeIn>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
