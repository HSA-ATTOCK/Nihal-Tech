"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const categories = [
  "New Phones",
  "Phone Accessories",
  "Computers/Laptops",
  "Computer Accessories",
];

const primaryButton =
  "rounded-lg bg-[#1f4b99] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1b3f82] disabled:opacity-60";

function filesToBase64(files: File[]): Promise<string[]> {
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

import { RawOption } from "@/lib/types";

type OptionInput = { value: string; price?: string };
type VariationInput = { name: string; options: OptionInput[] };

function VariationFields({
  values,
  onChange,
  idPrefix,
}: {
  values: VariationInput[];
  onChange: (next: VariationInput[]) => void;
  idPrefix: string;
}) {
  const update = (index: number, patch: Partial<VariationInput>) => {
    const next = values.map((item, idx) =>
      idx === index ? { ...item, ...patch } : item,
    );
    onChange(next);
  };

  const updateOption = (
    vIdx: number,
    oIdx: number,
    patch: Partial<OptionInput>,
  ) => {
    const next = values.map((item, idx) => {
      if (idx !== vIdx) return item;
      const nextOptions = item.options.map((opt, oi) =>
        oi === oIdx ? { ...opt, ...patch } : opt,
      );
      return { ...item, options: nextOptions };
    });
    onChange(next);
  };

  const addOption = (vIdx: number) => {
    const next = values.map((item, idx) =>
      idx === vIdx
        ? { ...item, options: [...item.options, { value: "", price: "" }] }
        : item,
    );
    onChange(next);
  };

  const removeOption = (vIdx: number, oIdx: number) => {
    const next = values.map((item, idx) => {
      if (idx !== vIdx) return item;
      if (item.options.length === 1) return item;
      return { ...item, options: item.options.filter((_, i) => i !== oIdx) };
    });
    onChange(next);
  };

  const removeVariation = (index: number) => {
    if (values.length === 1) return;
    onChange(values.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Variations</p>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...values,
              { name: "", options: [{ value: "", price: "" }] },
            ])
          }
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
              <div className="flex-1 text-sm text-slate-600">
                Options with optional prices
              </div>
              {values.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeVariation(idx)}
                  className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:border-rose-400"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            {variation.options.map((opt, oi) => (
              <div
                key={`${idPrefix}-${idx}-opt-${oi}`}
                className="grid grid-cols-3 gap-2"
              >
                <input
                  value={opt.value}
                  onChange={(e) =>
                    updateOption(idx, oi, { value: e.target.value })
                  }
                  placeholder="Option label (e.g., 32GB)"
                  className="col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
                />
                <input
                  value={opt.price}
                  onChange={(e) =>
                    updateOption(idx, oi, { price: e.target.value })
                  }
                  placeholder="Price (optional)"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
                />
                <div className="col-span-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => addOption(idx)}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-[#1f4b99]"
                  >
                    + Option
                  </button>
                  {variation.options.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeOption(idx, oi)}
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export type EditableProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string | null;
  description?: string | null;
  variations?: Array<{ name: string; options?: string[] | null }> | null;
  imageUrls?: string[] | null;
};

export default function EditProductClient({
  product,
}: {
  product: EditableProduct;
}) {
  const [name, setName] = useState(product.name || "");
  const [price, setPrice] = useState(String(product.price ?? ""));
  const [stock, setStock] = useState(String(product.stock ?? ""));
  const [category, setCategory] = useState(product.category || categories[0]);
  const [description, setDescription] = useState(product.description || "");
  const [variations, setVariations] = useState<VariationInput[]>(
    product.variations?.length
      ? product.variations.map((variation) => ({
          name: variation.name,
          options: (variation.options || []).map((opt: RawOption) =>
            typeof opt === "string"
              ? { value: opt, price: "" }
              : {
                  value: opt?.value || "",
                  price: opt?.price ? String(opt.price) : "",
                },
          ),
        }))
      : [{ name: "", options: [{ value: "", price: "" }] }],
  );

  const [existingImages, setExistingImages] = useState<string[]>(
    product.imageUrls || [],
  );
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const urls = newImages.map((file) => URL.createObjectURL(file));
    setNewImagePreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImages]);

  const minVariationPrice = useMemo(() => {
    const p: number[] = [];
    variations.forEach((v) => {
      (v.options || []).forEach((opt: OptionInput) => {
        const price = opt?.price ? Number(opt.price) : undefined;
        if (typeof price === "number") p.push(price);
      });
    });
    if (p.length) return Math.min(...p);
    return undefined;
  }, [variations]);

  const handleSave = async () => {
    if (!name.trim() || !price || !stock) {
      setError("Name, price, and stock are required");
      return;
    }

    if (!existingImages.length && !newImages.length) {
      setError("Keep or add at least one image");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload: Record<string, unknown> = {
        id: product.id,
        name: name.trim(),
        price: Number(price),
        stock: Number(stock),
        category,
        description: description.trim(),
        variations: variations
          .filter((variation) => variation.name.trim())
          .map((variation) => ({
            name: variation.name.trim(),
            options: variation.options
              .map((opt) => {
                const value = String(opt.value || "").trim();
                const priceVal = opt.price ? Number(opt.price) : undefined;
                return priceVal === undefined
                  ? value
                  : { value, price: priceVal };
              })
              .filter((o) => (typeof o === "string" ? o : o?.value)),
          })),
        keepImageUrls: existingImages,
      };

      if (newImages.length) {
        payload.images = await filesToBase64(newImages);
      }

      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save product");

      const updated = await res.json();
      setMessage("Product updated");
      setExistingImages(updated.imageUrls || []);
      setNewImages([]);
      setNewImagePreviews([]);
    } catch {
      setError("Unable to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Editing product
          </p>
          <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
          <p className="text-xs text-slate-500">ID: {product.id}</p>
        </div>
        <Link
          href="/admin/products"
          className="text-sm font-semibold text-[#1f4b99] hover:text-[#1b3f82]"
        >
          ← Back to products
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

      <div className="grid gap-4 md:grid-cols-2">
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
        {typeof minVariationPrice === "number" && (
          <p className="text-xs text-slate-500 mt-1">
            Displayed price will default to the lowest option price: £
            {minVariationPrice.toFixed(2)}
          </p>
        )}
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
        className="h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
      />

      <VariationFields
        values={variations}
        onChange={setVariations}
        idPrefix={`edit-${product.id}`}
      />

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-800">Existing images</p>
        {existingImages.length ? (
          <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
            {existingImages.map((url) => (
              <div
                key={url}
                className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
              >
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="Existing image"
                    className="h-24 w-full object-cover"
                  />
                </>
                <button
                  type="button"
                  onClick={() =>
                    setExistingImages((prev) =>
                      prev.filter((img) => img !== url),
                    )
                  }
                  className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-rose-600 shadow-sm hover:bg-white"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">No images kept.</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-800">Add new images</p>
        <input
          type="file"
          multiple
          onChange={(e) => {
            const files = Array.from(
              (e.target as HTMLInputElement).files || [],
            );
            if (!files.length) return;
            setNewImages((prev) => [...prev, ...files]);
            (e.target as HTMLInputElement).value = "";
          }}
          className="text-sm text-slate-700"
        />
        {newImagePreviews.length ? (
          <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
            {newImagePreviews.map((url, idx) => (
              <div
                key={url}
                className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
              >
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`New image ${idx + 1}`}
                    className="h-24 w-full object-cover"
                  />
                </>
                <button
                  type="button"
                  onClick={() =>
                    setNewImages((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-rose-600 shadow-sm hover:bg-white"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-500">ID: {product.id}</span>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={primaryButton}
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
