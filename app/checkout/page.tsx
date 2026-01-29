"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import Container from "@/components/Container";
import Button from "@/components/Button";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface CartItem {
  id: string;
  quantity: number;
  selectedVariations?: Record<string, string>;
  product: {
    id: string;
    name: string;
    price: number;
  };
}

export default function Checkout() {
  const { status, data: session } = useSession();
  const pathname = usePathname();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    const load = async () => {
      try {
        const res = await fetch("/api/cart");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load cart");
        setCart(data);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Failed to load cart",
        );
      }
    };
    load();
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load profile");
        setName((prev) => prev || data.name || "");
        setEmail((prev) => prev || data.email || "");
        setPhone((prev) => prev || data.phone || "");
        setAddress((prev) => prev || data.address || "");
      } catch (error) {
        setMessage(
          (prev) =>
            prev ||
            (error instanceof Error ? error.message : "Failed to load profile"),
        );
      }
    };
    loadProfile();
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const shipping = { name, email, phone, address };

  const validateDetails = () => {
    if (!name.trim() || !email.trim() || !address.trim() || !phone.trim()) {
      setMessage("Please fill name, email, phone, and address.");
      return false;
    }
    return true;
  };

  const goToPayment = () => {
    setMessage(null);
    if (!validateDetails()) return;
    setStep(2);
  };

  const pay = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    if (!validateDetails()) {
      setStep(1);
      return;
    }

    setLoading(true);
    setSuccess(null);
    try {
      const res = await axios.post("/api/checkout", {
        method: "card",
        shipping,
      });
      window.location.href = res.data.url;
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Payment failed. Please try again.",
      );
      setLoading(false);
    }
  };

  const payCod = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    if (!validateDetails()) {
      setStep(1);
      return;
    }

    setLoading(true);
    setSuccess(null);
    setMessage(null);
    try {
      const res = await axios.post("/api/checkout", {
        method: "cod",
        shipping,
      });
      setSuccess(res.data?.message || "Order confirmed for Cash on Delivery.");
      setCart([]);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not place order. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-700 shadow-sm max-w-md w-full">
          <h2 className="text-3xl font-bold mb-3 text-slate-900">
            💳 Checkout
          </h2>
          <p className="mb-6">Login or sign up to continue.</p>
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
    <div className="min-h-screen py-12 px-4 bg-slate-50">
      <Container>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Checkout
              </p>
              <h2 className="text-4xl font-bold text-slate-900">
                Secure checkout
              </h2>
              <p className="text-slate-600 text-sm">
                Provide your details, review your order, and choose payment.
              </p>
            </div>
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
            >
              ← Back to cart
            </Link>
          </div>

          {message && (
            <div className="mb-4 text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              {message}
            </div>
          )}
          {success && (
            <div className="mb-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              {success}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-6">
              {step === 1 && (
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Step 1 of 2
                      </p>
                      <h3 className="text-2xl font-bold text-slate-900">
                        Contact & address
                      </h3>
                    </div>
                    <span className="text-sm text-slate-500">
                      We prefilled from your profile
                    </span>
                  </div>
                  <div className="grid gap-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <label className="block text-sm font-semibold text-slate-700">
                        Name
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-[#1f4b99] focus:outline-none"
                          placeholder="Your full name"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Email
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-[#1f4b99] focus:outline-none"
                          placeholder="you@example.com"
                          type="email"
                        />
                      </label>
                    </div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Phone
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-[#1f4b99] focus:outline-none"
                        placeholder="e.g. +44 7123 456 789"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      Delivery address
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-[#1f4b99] focus:outline-none"
                        rows={3}
                        placeholder="Street, city, postcode"
                      />
                    </label>
                    <div className="flex justify-between gap-3">
                      <Link
                        href="/cart"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
                      >
                        ← Back to cart
                      </Link>
                      <Button onClick={goToPayment} className="px-10">
                        Next: Payment
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Step 2 of 2
                      </p>
                      <h3 className="text-2xl font-bold text-slate-900">
                        Payment
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-sm text-[#1f4b99] font-semibold hover:underline"
                    >
                      Edit details
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
                    <p className="text-sm text-slate-600 mb-3">Deliver to</p>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-700">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {name || "Name"}
                        </p>
                        <p>{email || "Email"}</p>
                        <p>{phone || "Phone"}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Address</p>
                        <p className="text-slate-700">{address || "Address"}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-200 mt-4">
                      <span className="text-slate-900 text-lg font-bold">
                        Total
                      </span>
                      <span className="text-3xl font-black text-[#1f4b99]">
                        £{total.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">
                        Order items
                      </p>
                      <div className="space-y-2 text-sm text-slate-700">
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-start rounded-lg border border-slate-200 bg-white px-3 py-2"
                          >
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-900">
                                {item.product.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                Qty: {item.quantity}
                              </p>
                              {item.selectedVariations &&
                                Object.keys(item.selectedVariations).length >
                                  0 && (
                                  <div className="flex flex-wrap gap-1 text-[11px] text-slate-600">
                                    {Object.entries(
                                      item.selectedVariations,
                                    ).map(([key, value]) => (
                                      <span
                                        key={`${item.id}-${key}-${value}`}
                                        className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1"
                                      >
                                        {key}: {value}
                                      </span>
                                    ))}
                                  </div>
                                )}
                            </div>
                            <p className="font-semibold text-[#1f4b99]">
                              £{(item.product.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-5xl mb-3">🛒</div>
                      <p className="text-slate-600">No items in cart</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      <Button
                        onClick={pay}
                        className="w-full text-base py-4"
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Pay with Card"}
                      </Button>
                      <button
                        type="button"
                        onClick={payCod}
                        disabled={loading}
                        className="w-full text-base py-4 rounded-full border border-slate-200 bg-white text-slate-900 font-semibold hover:border-[#1f4b99] transition"
                      >
                        {loading ? "Processing..." : "Cash on Delivery"}
                      </button>
                    </div>
                  )}

                  <p className="text-slate-500 text-sm mt-4">
                    🔒 Card payments use Stripe; Cash on Delivery confirms your
                    order instantly.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-fit">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Order summary
                  </p>
                  <h4 className="text-xl font-bold text-slate-900">Items</h4>
                </div>
                <span className="text-sm text-slate-500">
                  {cart.length} items
                </span>
              </div>
              {cart.length === 0 ? (
                <p className="text-sm text-slate-600">No items in cart</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start rounded-xl border border-slate-200 px-3 py-2"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900 text-sm">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Qty: {item.quantity}
                        </p>
                        {item.selectedVariations &&
                          Object.keys(item.selectedVariations).length > 0 && (
                            <div className="flex flex-wrap gap-1 text-[11px] text-slate-600">
                              {Object.entries(item.selectedVariations).map(
                                ([key, value]) => (
                                  <span
                                    key={`${item.id}-${key}-${value}`}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1"
                                  >
                                    {key}: {value}
                                  </span>
                                ),
                              )}
                            </div>
                          )}
                      </div>
                      <p className="font-semibold text-[#1f4b99] text-sm">
                        £{(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-2xl font-black text-[#1f4b99]">
                  £{total.toFixed(2)}
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Taxes and shipping calculated at payment.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
