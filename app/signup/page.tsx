"use client";

import axios from "axios";
import { useMemo, useState } from "react";
import Link from "next/link";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isEmailValid = useMemo(
    () => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email),
    [email],
  );

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordValid =
    passwordChecks.length && passwordChecks.uppercase && passwordChecks.special;
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  const handleRegister = async () => {
    setSuccess("");
    setError("");
    setTouchedEmail(true);
    setTouchedPassword(true);
    setTouchedConfirm(true);

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!isEmailValid) {
      setError("Enter a valid email address");
      return;
    }
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
      const response = await axios.post("/api/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (response.status === 200) {
        setSuccess("Check your email to verify your account.");
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setTouchedEmail(false);
        setTouchedPassword(false);
        setTouchedConfirm(false);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError("Email already registered. Please login instead.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const hintClass = (valid: boolean) =>
    valid ? "text-emerald-700" : "text-slate-500";

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-[#eef2f9] to-[#e1e9fb] py-12 px-4 flex items-center">
      <div className="w-full max-w-5xl mx-auto grid gap-8 lg:grid-cols-[1.05fr_0.95fr] items-center">
        <div className="hidden lg:block rounded-3xl bg-white border border-slate-200 p-10 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em] mb-4">
            Create account
          </p>
          <h2 className="text-3xl font-bold text-slate-900 leading-snug mb-4">
            Get verified to book repairs, shop devices, and track orders.
          </h2>
          <ul className="space-y-3 text-slate-700 text-sm">
            <li>• Secure login with email verification</li>
            <li>• Manage orders and repair bookings in one place</li>
            <li>• Save preferences for faster checkout</li>
          </ul>
          <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
            Need help? Contact support@nihaltech.com.
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-10 rounded-3xl shadow-lg">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Sign up</h2>
            <p className="text-slate-600">Create your account to continue.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Full name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouchedEmail(true)}
                placeholder="you@example.com"
                className={`w-full rounded-lg border px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none ${
                  touchedEmail && !isEmailValid
                    ? "border-rose-300"
                    : "border-slate-200 bg-white"
                }`}
              />
              {touchedEmail && !isEmailValid && (
                <p className="mt-1 text-xs text-rose-600">
                  Enter a valid email address.
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouchedPassword(true)}
                  placeholder="Create a strong password"
                  className={`w-full rounded-lg border px-3 py-2 pr-24 text-slate-900 focus:border-[#1f4b99] focus:outline-none ${
                    touchedPassword && !isPasswordValid
                      ? "border-rose-300"
                      : "border-slate-200 bg-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 my-1 px-3 rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouchedConfirm(true)}
                  placeholder="Re-enter your password"
                  className={`w-full rounded-lg border px-3 py-2 pr-24 text-slate-900 focus:border-[#1f4b99] focus:outline-none ${
                    touchedConfirm && !passwordsMatch
                      ? "border-rose-300"
                      : "border-slate-200 bg-white"
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRegister();
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 my-1 px-3 rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {touchedConfirm && !passwordsMatch && (
                <p className="mt-1 text-xs text-rose-600">
                  Passwords must match.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              className="w-full rounded-lg bg-[#1f4b99] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1b3f82] disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

            <div className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="text-[#1f4b99] font-semibold">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
