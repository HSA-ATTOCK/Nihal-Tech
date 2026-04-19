"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/categories", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load categories");
      const data: Category[] = await res.json();
      setCategories(data);
    } catch {
      setError("Could not load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const createCategory = async () => {
    const nextName = name.trim();
    if (!nextName) {
      setError("Enter a category name");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.message || "Failed to create category");

      setMessage(`Category "${nextName}" created`);
      setName("");
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create category",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category: Category) => {
    const ok = window.confirm(
      `Delete category "${category.name}"? Products in this category will become uncategorized.`,
    );
    if (!ok) return;

    setRemovingId(category.id);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.message || "Failed to delete category");

      const cleared =
        typeof data?.productsCleared === "number" ? data.productsCleared : 0;
      setMessage(
        cleared > 0
          ? `Category deleted and ${cleared} product${cleared === 1 ? "" : "s"} cleared`
          : "Category deleted",
      );
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete category",
      );
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Admin
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
            <p className="mt-1 text-slate-600">
              Create categories for products and remove them when they are no
              longer needed.
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="text-sm font-semibold text-[#1f4b99] hover:text-[#1b3f82]"
          >
            ← Back to dashboard
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

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New category name"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
            />
            <button
              type="button"
              onClick={createCategory}
              disabled={saving}
              className="rounded-lg bg-[#1f4b99] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1b3f82] disabled:opacity-60"
            >
              {saving ? "Creating..." : "Add category"}
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Deleting a category clears that category from any products using it.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">
              Current categories
            </p>
            {loading ? (
              <span className="text-xs text-slate-500">Loading...</span>
            ) : null}
          </div>

          {sortedCategories.length === 0 && !loading ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No categories yet.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {sortedCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span className="font-medium text-slate-900">
                    {category.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteCategory(category)}
                    disabled={removingId === category.id}
                    className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-50 disabled:opacity-60"
                  >
                    {removingId === category.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
