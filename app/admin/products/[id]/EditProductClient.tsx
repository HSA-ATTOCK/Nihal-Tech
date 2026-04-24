"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Category = {
  id: string;
  name: string;
};

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
import { resolveReturnHref } from "@/lib/navigation";
import PriceDisplay from "@/components/PriceDisplay";

type OptionInput = {
  value: string;
  price?: string;
  imageUrl?: string;
  imageFile?: File;
};
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
        ? {
            ...item,
            options: [...item.options, { value: "", price: "", imageUrl: "" }],
          }
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
                Options with optional prices & images
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

          <div className="space-y-3">
            {variation.options.map((opt, oi) => (
              <div
                key={`${idPrefix}-${idx}-opt-${oi}`}
                className="space-y-2 rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={opt.value}
                    onChange={(e) =>
                      updateOption(idx, oi, { value: e.target.value })
                    }
                    placeholder="Option label (e.g., 32GB)"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
                  />
                  <input
                    value={opt.price}
                    onChange={(e) =>
                      updateOption(idx, oi, { price: e.target.value })
                    }
                    placeholder="Price (optional)"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  {opt.imageUrl && !opt.imageFile && (
                    <div className="flex items-center gap-2">
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={opt.imageUrl}
                          alt="Current"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="text-xs text-slate-600">
                        Current image
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          updateOption(idx, oi, { imageFile: file });
                        }
                      }}
                      id={`variation-${idx}-option-${oi}-image-edit`}
                      className="hidden"
                    />
                    <label
                      htmlFor={`variation-${idx}-option-${oi}-image-edit`}
                      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[#1f4b99] hover:text-[#1f4b99] transition-colors"
                    >
                      {opt.imageFile
                        ? `📷 ${opt.imageFile.name}`
                        : "📷 Choose Image"}
                    </label>
                    {(opt.imageFile || opt.imageUrl) && (
                      <button
                        type="button"
                        onClick={() =>
                          updateOption(idx, oi, {
                            imageFile: undefined,
                            imageUrl: "",
                          })
                        }
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:border-rose-400"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {opt.imageFile && (
                    <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(opt.imageFile)}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
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
  originalPrice?: number | null;
  isDiscounted?: boolean | null;
  stock: number;
  category?: string | null;
  brand?: string | null;
  buyOneGetOneFree?: boolean | null;
  description?: string | null;
  variations?: Array<{ name: string; options?: string[] | null }> | null;
  imageUrls?: string[] | null;
};

export default function EditProductClient({
  product,
}: {
  product: EditableProduct;
}) {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState(product.name || "");
  const [price, setPrice] = useState(String(product.price ?? ""));
  const [stock, setStock] = useState(String(product.stock ?? ""));
  const [category, setCategory] = useState(product.category || "");
  const [brand, setBrand] = useState(product.brand || "");
  const [buyOneGetOneFree, setBuyOneGetOneFree] = useState(
    product.buyOneGetOneFree ?? false,
  );
  const [isDiscounted, setIsDiscounted] = useState(
    product.isDiscounted ?? false,
  );
  const [originalPrice, setOriginalPrice] = useState(
    product.originalPrice ? String(product.originalPrice) : "",
  );
  const [description, setDescription] = useState(product.description || "");
  const [variations, setVariations] = useState<VariationInput[]>(
    product.variations?.length
      ? product.variations.map((variation) => ({
          name: variation.name,
          options: (variation.options || []).map((opt: RawOption) =>
            typeof opt === "string"
              ? { value: opt, price: "", imageUrl: "" }
              : {
                  value: opt?.value || "",
                  price: opt?.price ? String(opt.price) : "",
                  imageUrl: opt?.imageUrl || "",
                },
          ),
        }))
      : [{ name: "", options: [{ value: "", price: "", imageUrl: "" }] }],
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
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load categories");
        const data: Category[] = await res.json();
        setCategories(data);
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  const categoryOptions = useMemo(() => {
    const next = [...categories];
    if (category && !next.some((item) => item.name === category)) {
      next.unshift({ id: `current-${category}`, name: category });
    }
    return next;
  }, [categories, category]);
  const returnHref = resolveReturnHref(
    searchParams.get("returnTo"),
    "/admin/products?tab=manage",
  );

  const discountPreview = useMemo(() => {
    const sale = Number(price);
    const before = Number(originalPrice);
    if (!isDiscounted || !sale || !before || before <= sale) return null;
    return Math.round(((before - sale) / before) * 100);
  }, [isDiscounted, originalPrice, price]);

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

    if (isDiscounted) {
      const sale = Number(price);
      const before = Number(originalPrice);
      if (!before || before <= sale) {
        setError("Original price must be higher than the discounted price");
        return;
      }
    }

    if (!existingImages.length && !newImages.length) {
      setError("Keep or add at least one image");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      // Handle variation option images
      const processedVariations = await Promise.all(
        variations
          .filter((variation) => variation.name.trim())
          .map(async (variation) => ({
            name: variation.name.trim(),
            options: await Promise.all(
              variation.options.map(async (opt) => {
                const value = String(opt.value || "").trim();
                const priceVal = opt.price ? Number(opt.price) : undefined;

                let imageUrl = opt.imageUrl?.trim() || undefined;

                // Upload variation option image if file is selected
                if (opt.imageFile) {
                  const base64 = await filesToBase64([opt.imageFile]);
                  imageUrl = base64[0]; // This will be processed by the API
                }

                if (priceVal === undefined && !imageUrl) {
                  return value;
                }

                const optionObj: {
                  value: string;
                  price?: number;
                  imageUrl?: string;
                } = { value };
                if (priceVal !== undefined) optionObj.price = priceVal;
                if (imageUrl) optionObj.imageUrl = imageUrl;

                return optionObj;
              }),
            ).then((options) =>
              options.filter((o) => (typeof o === "string" ? o : o?.value)),
            ),
          })),
      );

      const payload: Record<string, unknown> = {
        id: product.id,
        name: name.trim(),
        price: Number(price),
        originalPrice: isDiscounted ? Number(originalPrice) : null,
        isDiscounted,
        stock: Number(stock),
        category,
        brand: brand.trim(),
        buyOneGetOneFree,
        description: description.trim(),
        variations: processedVariations,
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
        <div className="space-y-2 text-right">
          <Link
            href={returnHref}
            className="text-sm font-semibold text-[#1f4b99] hover:text-[#1b3f82]"
          >
            ← Back to products
          </Link>
          <PriceDisplay
            price={Number(price) || product.price}
            originalPrice={
              isDiscounted ? Number(originalPrice) : product.originalPrice
            }
            isDiscounted={isDiscounted}
            containerClassName="justify-end"
            saleClassName="text-sm font-semibold text-slate-700"
            originalClassName="text-[11px]"
            badgeClassName="text-[10px]"
          />
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

      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product name"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
        />
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="Brand name (optional)"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={buyOneGetOneFree}
            onChange={(e) => setBuyOneGetOneFree(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#1f4b99] focus:ring-[#1f4b99]"
          />
          Buy one get one free
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isDiscounted}
            onChange={(e) => setIsDiscounted(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#1f4b99] focus:ring-[#1f4b99]"
          />
          Discounted product
        </label>
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={isDiscounted ? "Discounted price" : "Price"}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
        />
        {isDiscounted ? (
          <div className="space-y-2">
            <input
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="Before price"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
            />
            {discountPreview !== null ? (
              <p className="text-xs font-semibold text-rose-600">
                Auto discount: -{discountPreview}%
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Enter a higher before price to calculate the discount.
              </p>
            )}
          </div>
        ) : null}
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
          <option value="">Uncategorized</option>
          {categoryOptions.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
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
          id="add-product-images-input"
          className="hidden"
        />
        <label
          htmlFor="add-product-images-input"
          className="inline-block cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#1f4b99] hover:text-[#1f4b99] transition-colors"
        >
          📷{" "}
          {newImages.length > 0
            ? `${newImages.length} image${newImages.length > 1 ? "s" : ""} selected`
            : "Choose Images"}
        </label>
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
