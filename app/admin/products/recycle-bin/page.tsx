"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string | null;
  imageUrls?: string[] | null;
  deletedAt?: string | null;
};

export default function ProductRecycleBinPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRecycleBin = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products?view=recycle-bin", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load recycle bin");
      const data: Product[] = await res.json();
      setProducts(data);
    } catch {
      setError("Could not load recycle bin");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecycleBin();
  }, [loadRecycleBin]);

  const restoreProduct = async (product: Product) => {
    setActioningId(product.id);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to restore");

      setMessage(`Restored ${product.name}`);
      await loadRecycleBin();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to restore product",
      );
    } finally {
      setActioningId(null);
    }
  };

  const timeLeftLabel = (deletedAt?: string | null) => {
    if (!deletedAt) return "Scheduled for permanent deletion in 5 days";
    const purgeAt = new Date(deletedAt).getTime() + 5 * 24 * 60 * 60 * 1000;
    const diff = purgeAt - Date.now();
    if (diff <= 0) return "Will be permanently deleted soon";
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    return `${days} day${days > 1 ? "s" : ""} left before permanent deletion`;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Admin
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Recycle Bin</h1>
            <p className="text-slate-600 text-sm">
              Restore products before they are permanently deleted after 5 days.
            </p>
          </div>
          <Link
            href="/admin/products"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#1f4b99] hover:text-[#1f4b99]"
          >
            Back to products
          </Link>
        </div>

        {message ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
            {error}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">
              Deleted products
            </p>
            {loading && (
              <span className="text-xs text-slate-500">Loading...</span>
            )}
          </div>

          {products.length === 0 && !loading ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Recycle bin is empty.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
                >
                  {product.imageUrls?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrls[0]}
                      alt={product.name}
                      className="h-28 w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-amber-200 bg-amber-100 text-xs text-amber-700">
                      No image
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">
                      {product.name}
                    </p>
                    <p className="text-sm text-slate-600">
                      £{product.price} • Stock {product.stock}
                    </p>
                    <p className="text-xs text-slate-500">
                      {product.category || "Uncategorized"}
                    </p>
                    <p className="text-xs font-semibold text-amber-800">
                      {timeLeftLabel(product.deletedAt)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => restoreProduct(product)}
                      disabled={actioningId === product.id}
                      className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-60"
                    >
                      {actioningId === product.id ? "Restoring..." : "Restore"}
                    </button>
                    <span className="text-[11px] text-slate-500">
                      ID {product.id.slice(0, 6)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
