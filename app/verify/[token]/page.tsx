"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

type Status = "loading" | "success" | "error";

export default function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      try {
        const res = await fetch(`/api/verify/${token}`, { method: "POST" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Verification failed");
        }

        if (!cancelled) {
          setStatus("success");
          setMessage(data?.message || "Email verified successfully");
        }
      } catch (error) {
        console.error("Verification error", error);
        if (!cancelled) {
          setStatus("error");
          setMessage(
            error instanceof Error ? error.message : "Could not verify email",
          );
        }
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-[#eef2f9] to-[#e1e9fb] py-12 px-4 flex items-center">
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Verify
        </p>
        <h2 className="text-2xl font-bold text-slate-900">
          Email Verification
        </h2>
        <p className="text-sm text-slate-600">{message}</p>

        {status === "success" && (
          <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
            <p>Your email is verified. You can continue to sign in.</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            <p>Verification failed. Please request a new link.</p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="rounded-lg bg-[#1f4b99] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1b3f82]"
          >
            Go to login
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#1f4b99] hover:text-[#1f4b99]"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
