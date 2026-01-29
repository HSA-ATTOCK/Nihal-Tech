"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const categories = [
  "New Phones",
  "Phone Accessories",
  "Computers/Laptops",
  "Computer Accessories",
];

type VariationInput = { name: string; optionsText: string };

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string | null;
  description?: string | null;
  variations?: Array<{ name: string; options: string[] }> | null;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
};

const emptyVariation: VariationInput = { name: "", optionsText: "" };
const primaryButton =
  "rounded-lg bg-[#1f4b99] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1b3f82] disabled:opacity-60";

async function filesToBase64(files: File[]): Promise<string[]> {
  const readers = files.map(
    (file) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      }),
  );
  return Promise.all(readers);
}

type VariationFieldsProps = {
  values: VariationInput[];
  onChange: (next: VariationInput[]) => void;
  hint: string;
  idPrefix: string;
};

function VariationFields({
  values,
  onChange,
  hint,
  idPrefix,
}: VariationFieldsProps) {
  const update = (index: number, patch: Partial<VariationInput>) => {
    const next = values.map((item, idx) =>
      idx === index ? { ...item, ...patch } : item,
    );
    onChange(next);
  };

  const remove = (index: number) => {
    if (values.length === 1) return;
    onChange(values.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Variations</p>
        <button
          type="button"
          onClick={() => onChange([...values, { ...emptyVariation }])}
          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-[#1f4b99] hover:text-[#1f4b99]"
        >
          + Add variation
        </button>
      </div>

      {values.map((variation, idx) => (
        <div
          key={`${idPrefix}-${idx}`}
          className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
        >
          <div className="grid gap-2 md:grid-cols-2">
            <input
              value={variation.name}
              onChange={(e) => update(idx, { name: e.target.value })}
              placeholder="Color, Size, etc."
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
            />
            <div className="flex gap-2">
              <input
                value={variation.optionsText}
                onChange={(e) => update(idx, { optionsText: e.target.value })}
                placeholder={hint}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
              />
              {values.length > 1 ? (
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:border-rose-400"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminProducts() {
  const [tab, setTab] = useState<"add" | "manage">("add");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [savingNew, setSavingNew] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [variations, setVariations] = useState<VariationInput[]>([
    { ...emptyVariation },
  ]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageInputKey, setImageInputKey] = useState(0);

  const variationHint = useMemo(
    () => "Options comma separated, e.g., Black, Silver",
    [],
  );

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load products");
      const data: Product[] = await res.json();
      setProducts(data);
    } catch {
      setError("Could not load products");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));
    setImagePreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const upload = async () => {
    if (!name.trim() || !price || !stock || images.length === 0) {
      setError("Name, price, stock, and at least one image are required");
      return;
    }

    setSavingNew(true);
    setMessage("");
    setError("");

    try {
      const imageStrings = await filesToBase64(images);
      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock),
        category,
        images: imageStrings,
        variations: variations
          .filter((variation) => variation.name.trim())
          .map((variation) => ({
            name: variation.name.trim(),
            options: variation.optionsText
              .split(",")
              .map((option) => option.trim())
              .filter(Boolean),
          })),
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create product");

      setMessage("Product created");
      setName("");
      setPrice("");
      setDescription("");
      setStock("");
      setCategory(categories[0]);
      setVariations([{ ...emptyVariation }]);
      setImages([]);
      setImageInputKey((k) => k + 1);
      loadProducts();
    } catch {
      setError("Unable to save product");
    } finally {
      setSavingNew(false);
    }
  };

  const handleTabChange = (nextTab: "add" | "manage") => {
    setMessage("");
    setError("");
    setTab(nextTab);
  };

  const addTab = (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product name"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
          />
          <input
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="Stock"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
        />

        <VariationFields
          values={variations}
          onChange={setVariations}
          hint={variationHint}
          idPrefix="new"
        />

        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-800">Images</p>
          <input
            key={imageInputKey}
            type="file"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files || []))}
            className="text-sm text-slate-700"
          />
          {imagePreviews.length ? (
            <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
              {imagePreviews.map((url, idx) => (
                <div
                  key={url}
                  className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Preview ${idx + 1}`}
                    className="h-24 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImages((prev) => prev.filter((_, i) => i !== idx));
                      setImageInputKey((k) => k + 1);
                    }}
                    className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-rose-600 shadow-sm hover:bg-white"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={upload}
          disabled={savingNew}
          className={primaryButton}
        >
          {savingNew ? "Saving..." : "Add product"}
        </button>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-700">
          Upload at least one image. Variation options are optional; they let
          you define color, size, storage, or other choices. Use commas to
          separate options.
        </p>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Example</p>
          <p className="mt-2">Variation name: Color</p>
          <p>Options: Black, Silver, Gold</p>
        </div>
      </div>
    </div>
  );

  const manageTab = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Products</p>
        {loadingProducts && (
          <span className="text-xs text-slate-500">Loading...</span>
        )}
      </div>

      {products.length === 0 && !loadingProducts ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No products yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              {product.imageUrls?.[0] ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrls[0]}
                    alt={product.name}
                    className="h-32 w-full rounded-lg object-cover"
                  />
                </>
              ) : (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500">
                  No image
                </div>
              )}
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">{product.name}</p>
                <p className="text-sm text-slate-600">
                  £{product.price} • Stock {product.stock}
                </p>
                <p className="text-xs text-slate-500">
                  {product.category || "Uncategorized"}
                </p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="rounded-lg bg-[#1f4b99] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1b3f82]"
                >
                  Edit product
                </Link>
                <span className="text-[11px] text-slate-400">
                  ID {product.id.slice(0, 6)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Admin
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Products</h1>
            <p className="text-slate-600 text-sm">
              Add new products or edit existing inventory.
            </p>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => handleTabChange("add")}
              className={`${
                tab === "add"
                  ? "bg-[#1f4b99] text-white"
                  : "text-slate-600 hover:text-slate-900"
              } rounded-lg px-4 py-2 text-sm font-semibold transition`}
            >
              Add product
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("manage")}
              className={`${
                tab === "manage"
                  ? "bg-[#1f4b99] text-white"
                  : "text-slate-600 hover:text-slate-900"
              } rounded-lg px-4 py-2 text-sm font-semibold transition`}
            >
              Manage products
            </button>
          </div>
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

        {tab === "add" ? addTab : manageTab}
      </div>
    </div>
  );
}
