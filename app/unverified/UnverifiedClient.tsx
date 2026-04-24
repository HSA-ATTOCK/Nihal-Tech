"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function UnverifiedClient({
  initialEmail,
}: {
  initialEmail: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    "Your account is not verified yet. Please verify your email to continue.",
  );
  const [error, setError] = useState("");

  const resendVerification = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Could not resend verification email");
      }

      setMessage(
        data?.message || "Verification email sent again. Check your inbox.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-[#eef2f9] to-[#e1e9fb] flex items-center px-4 py-12">
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-lg space-y-5 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Account verification
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          You are not verified yet
        </h1>
        <p className="text-sm text-slate-600">
          Please verify your email to unlock your dashboard, orders, repairs,
          and other account features.
        </p>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
          <label className="text-sm font-semibold text-slate-700 block">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
          />
        </div>

        {message ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 text-left">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 text-left">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={resendVerification}
            disabled={loading || !email.trim()}
            className="rounded-lg bg-[#1f4b99] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1b3f82] disabled:opacity-60"
          >
            {loading ? "Sending..." : "Resend verification email"}
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-[#1f4b99] hover:text-[#1f4b99]"
          >
            Logout
          </button>
        </div>

        <div className="pt-2 text-sm text-slate-600">
          <Link href="/login" className="font-semibold text-[#1f4b99]">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
