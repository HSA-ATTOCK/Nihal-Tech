"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Booking {
  id: string;
  phoneModel: string;
  issue: string;
  date: string;
  status: string;
  createdAt: string;
}

export default function BookingsPage() {
  const { status } = useSession();
  const pathname = usePathname();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/repair");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load bookings");
      setBookings(data);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load bookings",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      load();
    }
  }, [status]);

  const deleteBooking = async (id: string) => {
    try {
      const res = await fetch("/api/repair", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Delete failed");
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
    }
  };

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-700 shadow-sm max-w-md w-full">
          <h2 className="text-3xl font-bold mb-3 text-slate-900">
            My Bookings
          </h2>
          <p className="mb-6">Login or sign up to view your repair bookings.</p>
          <div className="flex gap-3 justify-center">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
              className="bg-[#1f4b99] text-white px-6 py-2.5 rounded-full hover:bg-[#163a79] transition-all duration-200 shadow-sm font-semibold"
            >
              Login
            </Link>
            <Link
              href={`/signup?callbackUrl=${encodeURIComponent(pathname)}`}
              className="px-6 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:border-[#1f4b99] transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
            <p className="text-slate-600">Manage your repair appointments</p>
          </div>
          <Link
            href="/repair-booking"
            className="text-[#1f4b99] hover:text-[#163a79] font-semibold"
          >
            + New Booking
          </Link>
        </div>

        {message && (
          <div className="mb-4 text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            {message}
          </div>
        )}

        {loading ? (
          <p className="text-slate-600">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-700 shadow-sm">
            No bookings yet.
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm"
              >
                <div>
                  <h3 className="text-slate-900 font-semibold">
                    {b.phoneModel}
                  </h3>
                  <p className="text-slate-700 text-sm">Issue: {b.issue}</p>
                  <p className="text-slate-600 text-sm">
                    Date: {new Date(b.date).toLocaleDateString("en-GB")}
                  </p>
                  <p className="text-slate-600 text-sm">
                    Time:{" "}
                    {new Date(b.date).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-slate-600 text-sm">Status: {b.status}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteBooking(b.id)}
                    className="px-4 py-2 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
