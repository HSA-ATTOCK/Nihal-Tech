"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const isEmailValid = (value: string) =>
    /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);

  const submit = async () => {
    setTouched(true);
    if (!email.trim() || !isEmailValid(email)) {
      setError("Enter a valid email address");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Could not send email");
      }

      setMessage(
        data?.message ||
          "If this email is verified, a reset link has been sent.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Account
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Forgot password</h1>
          <p className="text-sm text-slate-600">
            Enter your verified email to receive a reset link.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}

        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="you@example.com"
            className={`w-full rounded-lg border px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none ${
              touched && !isEmailValid(email)
                ? "border-rose-300"
                : "border-slate-200 bg-white"
            }`}
          />
          {touched && !isEmailValid(email) && (
            <p className="text-xs text-rose-600">
              Enter a valid email address.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-[#1f4b99] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1b3f82] disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>

        <div className="mt-6 text-center text-sm text-slate-600">
          Remembered your password?{" "}
          <Link href="/login" className="text-[#1f4b99] font-semibold">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
