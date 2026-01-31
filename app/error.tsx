"use client";

import Link from "next/link";

const contactEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
  "support@example.com";
const contactPhone =
  process.env.NEXT_PUBLIC_CONTACT_PHONE ||
  process.env.NEXT_PUBLIC_SUPPORT_PHONE ||
  "";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Unexpected error
          </p>
          <h1 className="text-3xl font-bold">Something went wrong</h1>
          <p className="text-slate-600">
            The page encountered a problem. Please try again, or contact us if
            it persists.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-3 inline-block text-left">
          <p className="text-sm font-semibold text-slate-800">
            Contact support
          </p>
          <p className="text-sm text-slate-700">
            Email:{" "}
            <a
              className="text-[#1f4b99] font-semibold"
              href={`mailto:${contactEmail}`}
            >
              {contactEmail}
            </a>
          </p>
          {contactPhone && (
            <p className="text-sm text-slate-700">
              Phone:{" "}
              <a
                className="text-[#1f4b99] font-semibold"
                href={`tel:${contactPhone}`}
              >
                {contactPhone}
              </a>
            </p>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-[#1f4b99] px-5 py-2 text-sm font-semibold text-white hover:bg-[#163a79]"
          >
            Retry
          </button>
          <Link
            href="/"
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
