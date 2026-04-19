"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
};

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
  buyOneGetOneFree?: boolean | null;
};

type OptionInput = {
  value: string;
  price?: string;
  imageUrl?: string;
  imageFile?: File;
};
type VariationInput = { name: string; options: OptionInput[] };

const emptyVariation: VariationInput = {
  name: "",
  options: [{ value: "", price: "", imageUrl: "" }],
};
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
  idPrefix: string;
};

function VariationFields({ values, onChange, idPrefix }: VariationFieldsProps) {
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
                      id={`variation-${idx}-option-${oi}-image`}
                      className="hidden"
                    />
                    <label
                      htmlFor={`variation-${idx}-option-${oi}-image`}
                      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[#1f4b99] hover:text-[#1f4b99] transition-colors"
                    >
                      {opt.imageFile
                        ? `📷 ${opt.imageFile.name}`
                        : "📷 Choose Image"}
                    </label>
                    {opt.imageFile && (
                      <button
                        type="button"
                        onClick={() =>
                          updateOption(idx, oi, { imageFile: undefined })
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

export default function AdminProducts() {
  const [tab, setTab] = useState<"add" | "manage">("add");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [managePage, setManagePage] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [savingNew, setSavingNew] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [buyOneGetOneFree, setBuyOneGetOneFree] = useState(false);
  const [variations, setVariations] = useState<VariationInput[]>([
    { ...emptyVariation },
  ]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageInputKey, setImageInputKey] = useState(0);
  const managePageSize = 9;

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

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load categories");
      const data: Category[] = await res.json();
      setCategories(data);
    } catch {
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0].name);
    }
  }, [category, categories]);

  useEffect(() => {
    setManagePage(1);
  }, [productSearch, products.length]);

  const removeProduct = async (product: Product) => {
    const ok = window.confirm(
      `Are you sure you want to remove "${product.name}"? It will move to recycle bin and be permanently deleted after 5 days.`,
    );
    if (!ok) return;

    setActioningId(product.id);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to remove");
      setMessage(
        "Product moved to recycle bin. You can restore it from Recycle Bin page.",
      );
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove product");
    } finally {
      setActioningId(null);
    }
  };

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));
    setImagePreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const minVariationPrice = useMemo(() => {
    const p: number[] = [];
    variations.forEach((v) => {
      (v.options || []).forEach((opt: OptionInput) => {
        const price = opt?.price;
        if (typeof price === "number") p.push(price);
      });
    });
    if (p.length) return Math.min(...p);
    return undefined;
  }, [variations]);

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

      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock),
        category,
        brand: brand.trim(),
        buyOneGetOneFree,
        images: imageStrings,
        variations: processedVariations,
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
      setCategory("");
      setBrand("");
      setBuyOneGetOneFree(false);
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

  const filteredManageProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => {
      const haystack = [
        product.name,
        product.category || "",
        product.description || "",
        product.id,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [productSearch, products]);

  const totalManagePages = Math.max(
    1,
    Math.ceil(filteredManageProducts.length / managePageSize),
  );
  const currentManagePage = Math.min(managePage, totalManagePages);
  const paginatedManageProducts = useMemo(() => {
    const start = (currentManagePage - 1) * managePageSize;
    return filteredManageProducts.slice(start, start + managePageSize);
  }, [currentManagePage, filteredManageProducts]);

  const visibleManagePages = useMemo(() => {
    if (totalManagePages <= 7) {
      return Array.from({ length: totalManagePages }, (_, i) => i + 1);
    }

    if (currentManagePage <= 4) {
      return [1, 2, 3, 4, 5, -1, totalManagePages];
    }

    if (currentManagePage >= totalManagePages - 3) {
      return [
        1,
        -1,
        totalManagePages - 4,
        totalManagePages - 3,
        totalManagePages - 2,
        totalManagePages - 1,
        totalManagePages,
      ];
    }

    return [
      1,
      -1,
      currentManagePage - 1,
      currentManagePage,
      currentManagePage + 1,
      -1,
      totalManagePages,
    ];
  }, [currentManagePage, totalManagePages]);

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
            disabled={loadingCategories}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-[#1f4b99] focus:outline-none"
          >
            <option value="">Uncategorized</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          {!loadingCategories && categories.length === 0 ? (
            <p className="text-xs text-slate-500">
              No categories exist yet. Create one from the Categories page.
            </p>
          ) : null}
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
          idPrefix="new"
        />

        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-800">Images</p>
          <input
            key={imageInputKey}
            type="file"
            multiple
            onChange={(e) => {
              const files = Array.from(
                (e.target as HTMLInputElement).files || [],
              );
              if (!files.length) return;
              setImages((prev) => [...prev, ...files]);
              // clear input so selecting same files again works
              (e.target as HTMLInputElement).value = "";
            }}
            id="product-images-input"
            className="hidden"
          />
          <label
            htmlFor="product-images-input"
            className="inline-block cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#1f4b99] hover:text-[#1f4b99] transition-colors"
          >
            📷{" "}
            {images.length > 0
              ? `${images.length} image${images.length > 1 ? "s" : ""} selected`
              : "Choose Images"}
          </label>
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
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/recycle-bin"
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Open recycle bin
          </Link>
          {loadingProducts && (
            <span className="text-xs text-slate-500">Loading...</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="w-full md:max-w-md">
          <input
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search product by name, category, description or id"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1f4b99] focus:outline-none"
          />
        </div>
        <p className="text-xs text-slate-500">
          Showing {paginatedManageProducts.length} of{" "}
          {filteredManageProducts.length} product(s)
        </p>
      </div>

      {filteredManageProducts.length === 0 && !loadingProducts ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No products found for this search.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedManageProducts.map((product) => (
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
                  {product.buyOneGetOneFree ? (
                    <span className="ml-2 inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                      BOGO
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-500">
                  {product.category || "Uncategorized"}
                </p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="rounded-lg bg-[#1f4b99] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1b3f82]"
                  >
                    Edit product
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeProduct(product)}
                    disabled={actioningId === product.id}
                    className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-50 disabled:opacity-60"
                  >
                    {actioningId === product.id ? "Removing..." : "Remove"}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400">
                  ID {product.id.slice(0, 6)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredManageProducts.length > 0 && totalManagePages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setManagePage((prev) => Math.max(1, prev - 1))}
            disabled={currentManagePage === 1}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[#1f4b99] disabled:opacity-50"
          >
            Previous
          </button>

          {visibleManagePages.map((page, idx) =>
            page < 0 ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-1 text-xs font-semibold text-slate-400"
              >
                ...
              </span>
            ) : (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => setManagePage(page)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  page === currentManagePage
                    ? "border-[#1f4b99] bg-[#1f4b99] text-white"
                    : "border-slate-200 text-slate-700 hover:border-[#1f4b99]"
                }`}
              >
                {page}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() =>
              setManagePage((prev) => Math.min(totalManagePages, prev + 1))
            }
            disabled={currentManagePage === totalManagePages}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[#1f4b99] disabled:opacity-50"
          >
            Next
          </button>
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
