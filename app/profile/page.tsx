"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Container from "@/components/Container";
import Input from "@/components/Input";
import Button from "@/components/Button";

export default function ProfilePage() {
  const { status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    const load = async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load profile");
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Failed to load profile",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [status]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Update failed");
      setMessage("Profile updated");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-700 shadow-sm max-w-md w-full">
          <p className="mb-4">Please log in to view your profile.</p>
          <Link
            href="/login"
            className="bg-[#1f4b99] text-white px-6 py-2.5 rounded-full hover:bg-[#163a79] transition-colors font-semibold"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-[#eef2f9] to-[#e1e9fb] py-12">
      <Container>
        <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-[1.05fr_0.95fr] items-start">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.18em]">
                  Profile
                </p>
                <h1 className="text-3xl font-bold text-slate-900 mt-1">
                  Account overview
                </h1>
                <p className="text-slate-600 mt-2">
                  Update your details and access quick actions.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* <Link
                  href="/payment-methods"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
                >
                  Payment methods
                </Link> */}
                <span className="rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1">
                  {status === "authenticated" ? "Signed in" : "Guest"}
                </span>
              </div>
            </div>

            {message && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {message}
              </div>
            )}

            {loading ? (
              <p className="text-slate-600">Loading...</p>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email
                  </label>
                  <Input value={email} disabled placeholder="Email" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Phone
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-[#1f4b99] focus:outline-none"
                    rows={3}
                    placeholder="Street, city, postcode"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="px-6"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                  <Link
                    href="/"
                    className="px-6 py-3 rounded-lg border border-slate-200 text-slate-700 hover:border-[#1f4b99] transition-colors"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-900">
                Quick links
              </h2>
              <p className="text-sm text-slate-600">
                Jump to your frequently used actions.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "Payment methods", href: "/payment-methods" },
                { label: "View bookings", href: "/bookings" },
                { label: "Track orders", href: "/orders" },
                { label: "Shop devices", href: "/shop" },
                { label: "Book a repair", href: "/repair-booking" },
                { label: "Go to cart", href: "/cart" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-lg border border-slate-200 px-4 py-3 text-slate-800 hover:border-[#1f4b99]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Need to update billing or support details? Contact us via the
              contact form and we will follow up.
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
