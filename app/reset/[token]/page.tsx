"use client";
import Link from "next/link";
import { useState } from "react";

interface ResetProps {
  params: Promise<{ token: string }>;
}

export default function Reset({ params }: ResetProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordValid =
    passwordChecks.length && passwordChecks.uppercase && passwordChecks.special;
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  const reset = async () => {
    setError("");
    setMessage("");

    if (!isPasswordValid) {
      setError(
        "Password must be 8+ characters, include one uppercase and one special character",
      );
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords must match");
      return;
    }

    setLoading(true);
    try {
      const { token } = await params;
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Could not reset password");
      }

      setMessage(data?.message || "Password updated successfully");
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  const hintClass = (valid: boolean) =>
    valid ? "text-emerald-700" : "text-slate-500";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center">
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Security
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
          <p className="text-sm text-slate-600">
            Choose a strong new password.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        {!success && message && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              {message || "Password updated successfully"}
            </div>
            <p className="text-sm text-slate-600">
              You can now sign in with your new password.
            </p>
            <Link
              href="/login"
              className="inline-flex w-full justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-[#1f4b99]"
            >
              Go to login
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={`w-full rounded-lg border px-3 py-2 pr-12 text-slate-900 focus:border-[#1f4b99] focus:outline-none ${
                    !isPasswordValid && password
                      ? "border-rose-300"
                      : "border-slate-200 bg-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-2 my-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:border-[#1f4b99]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="mt-2 grid gap-1 text-xs">
                <span className={hintClass(passwordChecks.length)}>
                  • At least 8 characters
                </span>
                <span className={hintClass(passwordChecks.uppercase)}>
                  • At least one uppercase letter
                </span>
                <span className={hintClass(passwordChecks.special)}>
                  • At least one special character
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={`w-full rounded-lg border px-3 py-2 pr-12 text-slate-900 focus:border-[#1f4b99] focus:outline-none ${
                    confirmPassword && !passwordsMatch
                      ? "border-rose-300"
                      : "border-slate-200 bg-white"
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") reset();
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-2 my-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:border-[#1f4b99]"
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-xs text-rose-600">
                  Passwords must match.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={reset}
              disabled={loading}
              className="w-full rounded-lg bg-[#1f4b99] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1b3f82] disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
