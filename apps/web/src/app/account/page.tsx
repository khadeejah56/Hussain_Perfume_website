"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { ApiError } from "@/lib/api";
import { FadeIn } from "@/components/motion/fade-in";
import type { UserProfile } from "@/lib/types";

export default function AccountProfilePage() {
  const { authFetch } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    authFetch<UserProfile>("/users/me").then((data) => {
      setProfile(data);
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setPhone(data.phone ?? "");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError(null);
    try {
      const updated = await authFetch<UserProfile>("/users/me", {
        method: "PATCH",
        body: { firstName, lastName, phone: phone || undefined },
      });
      setProfile(updated);
      showToast("Profile updated");
    } catch (error) {
      setProfileError(error instanceof ApiError ? error.message : "Update failed");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingPassword(true);
    setPasswordError(null);
    try {
      await authFetch("/users/me/password", { method: "PATCH", body: { currentPassword, newPassword } });
      showToast("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      setPasswordError(error instanceof ApiError ? error.message : "Could not change password");
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (!profile) return <p className="text-neutral-500">Loading...</p>;

  return (
    <FadeIn className="space-y-10">
      <section>
        <h1 className="mb-4 font-display text-2xl font-semibold text-neutral-900">Profile</h1>
        <form onSubmit={handleProfileSubmit} className="max-w-md space-y-3">
          <p className="text-sm text-neutral-500">{profile.email}</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="rounded border border-neutral-300 px-3 py-2"
              placeholder="First name"
            />
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="rounded border border-neutral-300 px-3 py-2"
              placeholder="Last name"
            />
          </div>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
            placeholder="Phone"
          />
          {profileError && <p className="text-sm text-red-600">{profileError}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isSavingProfile}
            className="rounded-full bg-neutral-900 px-5 py-2 text-sm text-white transition-colors hover:bg-gold-700 disabled:opacity-50"
          >
            {isSavingProfile ? "Saving..." : "Save Changes"}
          </motion.button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-semibold text-neutral-900">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-3">
          <input
            required
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
            placeholder="Current password"
          />
          <input
            required
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
            placeholder="New password"
          />
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isSavingPassword}
            className="rounded-full bg-neutral-900 px-5 py-2 text-sm text-white transition-colors hover:bg-gold-700 disabled:opacity-50"
          >
            {isSavingPassword ? "Saving..." : "Change Password"}
          </motion.button>
        </form>
      </section>
    </FadeIn>
  );
}
