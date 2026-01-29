"use client";
import { useEffect, useState } from "react";
import Container from "@/components/Container";
import Button from "@/components/Button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

interface CartItem {
  id: string;
  quantity: number;
  selectedVariations?: Record<string, string>;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
}

export default function Cart() {
  const { status } = useSession();
  const pathname = usePathname();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchCart = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load cart");
      setCart(data);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load cart",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchCart();
    }
  }, [status]);

  const removeItem = async (itemId: string) => {
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to remove");
      setCart(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to remove");
    }
  };

  const clearCart = async () => {
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to clear");
      setCart(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to clear");
    }
  };

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-700 shadow-sm max-w-md w-full">
          <h2 className="text-3xl font-bold mb-3 text-slate-900">
            🛒 Your Cart
          </h2>
          <p className="mb-6">Login or sign up to see your cart.</p>
          <div className="flex gap-3 justify-center">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
              className="bg-[#1f4b99] text-white visited:text-white px-6 py-2.5 rounded-full hover:bg-[#163a79] transition-all duration-200 shadow-sm font-semibold"
            >
              Login
            </Link>
            <Link
              href={`/signup?callbackUrl=${encodeURIComponent(pathname)}`}
              className="px-6 py-2.5 rounded-full border border-[#1f4b99] text-[#1f4b99] visited:text-[#1f4b99] bg-white hover:bg-[#1f4b99] hover:text-white hover:visited:text-white transition-colors shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-slate-50">
      <Container>
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Cart
              </p>
              <h2 className="text-4xl font-bold text-slate-900">Your cart</h2>
              <p className="text-slate-600 text-base">
                Review items and proceed to checkout
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
            >
              ← Continue shopping
            </Link>
          </div>
        </div>

        {message && (
          <div className="mb-4 text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            {message}
          </div>
        )}

        {loading ? (
          <p className="text-slate-600">Loading cart...</p>
        ) : cart.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm">
              <div className="text-5xl mb-3">🛒</div>
              <p className="text-slate-600 text-base mb-5">
                Your cart is empty
              </p>
              <Link href="/shop">
                <Button className="text-lg px-8">🛍️ Continue Shopping</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-[#1f4b99] transition-all duration-200 group shadow-sm"
                >
                  <div className="flex justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-slate-900 text-base group-hover:text-[#1f4b99] transition-colors">
                        {item.product.name}
                      </h3>
                      {item.selectedVariations &&
                        Object.keys(item.selectedVariations).length > 0 && (
                          <div className="space-y-1">
                            <p className="text-slate-500 text-xs uppercase tracking-wide">
                              Selections
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(item.selectedVariations).map(
                                ([key, value]) => (
                                  <span
                                    key={`${item.id}-${key}-${value}`}
                                    className="text-xs px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700"
                                  >
                                    {key}: {value}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      <p className="text-slate-600 text-sm">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right space-y-3 min-w-30">
                      <p className="text-slate-900 font-semibold text-lg">
                        £{(item.product.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-rose-600 hover:text-rose-700 font-semibold px-4 py-2 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm h-fit space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Summary
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900">Total</h3>
                  <p className="text-sm text-slate-600">
                    Taxes calculated at checkout
                  </p>
                </div>
                <p className="text-4xl font-black text-[#1f4b99]">
                  £{total.toFixed(2)}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/checkout" className="w-full">
                  <Button className="w-full text-base py-3">
                    Proceed to checkout
                  </Button>
                </Link>
                <button
                  onClick={clearCart}
                  className="w-full px-6 py-3 bg-white border border-slate-200 rounded-full hover:border-rose-300 text-rose-600 font-semibold transition-all duration-200"
                >
                  Clear cart
                </button>
                {/* <Link
                  href="/shop"
                  className="flex justify-center rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
                >
                  Continue shopping
                </Link> */}
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
