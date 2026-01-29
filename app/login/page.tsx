"use client";

import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/components/Input";
import Button from "@/components/Button";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleLogin = async () => {
    console.log("🚀 handleLogin called!", { email, password });

    if (!email || !password) {
      console.log("❌ Validation failed");
      setError("Please fill in all fields");
      return;
    }

    console.log("✅ Starting login...");
    setLoading(true);
    setError("");

    try {
      console.log("📡 Calling signIn...");
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      console.log("📥 Result:", result);

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        try {
          const sessionRes = await fetch("/api/auth/session", {
            cache: "no-store",
          });
          const sessionJson = await sessionRes.json();
          const role = sessionJson?.user?.role;

          const destination =
            (callbackUrl && callbackUrl !== "/" ? callbackUrl : undefined) ||
            (role === "ADMIN" ? "/admin/dashboard" : "/");

          router.push(destination);
        } catch (fetchErr) {
          console.error("Failed to fetch session after login", fetchErr);
          router.push(callbackUrl || "/");
        }
      }
    } catch (error) {
      console.error("💥 Error:", error);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-[#eef2f9] to-[#e1e9fb] flex items-center">
      <div className="w-full max-w-5xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-center">
          <div className="hidden lg:block rounded-3xl bg-white border border-slate-200 p-10 shadow-sm">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em] mb-4">
              Welcome back
            </p>
            <h2 className="text-3xl font-bold text-slate-900 leading-snug mb-4">
              Manage your orders, repairs, and devices from one dashboard.
            </h2>
            <ul className="space-y-3 text-slate-700 text-sm">
              <li>• Track repair status and delivery updates</li>
              <li>• Manage orders, invoices, and service requests</li>
              <li>• Save devices for faster future bookings</li>
            </ul>
            <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
              Having trouble signing in? Contact support@nihaltech.com.
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-10 rounded-3xl shadow-lg">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Sign in
              </h2>
              <p className="text-slate-600">Access your account to continue.</p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLogin();
                    }}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-3 my-1 px-3 rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="mt-2 text-right text-sm">
                  <Link
                    href="/forgot"
                    className="text-[#1f4b99] font-semibold hover:text-[#1b3f82]"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="w-full justify-center mt-2"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>

              <div className="text-center text-sm text-slate-600">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-[#1f4b99] font-semibold">
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-600">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
