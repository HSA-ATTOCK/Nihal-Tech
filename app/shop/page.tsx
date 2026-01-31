"use client";
import { useEffect, useState, useRef } from "react";
import Container from "@/components/Container";
import Input from "@/components/Input";
import ProductCard from "@/components/ProductCard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { RawOption } from "@/lib/types";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  imageUrls?: string[];
  category?: string;
  variations?: Array<{ name: string; options: string[] }>;
  stock: number;
  averageRating?: number;
  reviewCount?: number;
}

const categories = [
  { key: "All", label: "All" },
  { key: "New Phones", label: "New Phones" },
  { key: "Phone Accessories", label: "Phone Accessories" },
  { key: "Computers/Laptops", label: "Computers/Laptops" },
  { key: "Computer Accessories", label: "Computer Accessories" },
];

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("default");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariations, setSelectedVariations] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [modalPrice, setModalPrice] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => setCurrentPage(1), [search, activeCategory, products]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const getOptionValue = (opt: RawOption) =>
    typeof opt === "string" ? opt : opt?.value;
  const getOptionPrice = (opt: RawOption) =>
    typeof opt === "string"
      ? undefined
      : opt && typeof opt.price === "number"
        ? opt.price
        : undefined;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/products").then((res) => res.json()),
      fetch("/api/reviews/summary").then((res) => res.json()),
    ])
      .then(([productsData, reviewsData]) => {
        const enriched = productsData.map((p: Product) => ({
          ...p,
          averageRating: reviewsData[p.id]?.average || 0,
          reviewCount: reviewsData[p.id]?.count || 0,
        }));
        setProducts(enriched);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "top-reviewed") {
      if (b.reviewCount !== a.reviewCount)
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      return (b.averageRating || 0) - (a.averageRating || 0);
    }
    return 0;
  });

  const modalNeedsVariations = (selectedProduct?.variations || []).length > 0;
  const modalAllSelected = (selectedProduct?.variations || []).every(
    (v) => selectedVariations[v.name],
  );

  useEffect(() => {
    // Ensure we scroll to top whenever the page changes (pagination)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    const blank: Record<string, string> = {};
    (product.variations || []).forEach((v) => {
      blank[v.name] = "";
    });
    setSelectedVariations(blank);

    // set initial modal price to lowest variation price if available
    const prices: number[] = [];
    (product.variations || []).forEach((v) => {
      (v.options || []).forEach((opt: RawOption) => {
        if (typeof opt === "object" && typeof opt.price === "number")
          prices.push(opt.price);
      });
    });
    setModalPrice(prices.length ? Math.min(...prices) : product.price);
  };

  const handleConfirmAdd = async () => {
    if (!selectedProduct) return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (quantity <= 0) {
      alert("Quantity must be at least 1");
      return;
    }

    const needsSelection = (selectedProduct.variations || []).length > 0;
    if (needsSelection) {
      const unselected = Object.entries(selectedVariations).some(
        ([, value]) => !value,
      );
      if (unselected) {
        alert("Please select all variations first");
        return;
      }
    }

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity,
          selectedVariations,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Could not add to cart");
      }

      alert("Added to cart!");
      setSelectedProduct(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not add to cart");
    }
  };

  return (
    <div className="min-h-screen py-12">
      <Container>
        <div className="mb-8">
          <h2 className="text-4xl font-semibold mb-2 text-slate-900">
            Shop premium devices
          </h2>
          <p className="text-slate-600 text-base">
            Discover curated phones, accessories, and laptops ready to ship
            fast.
          </p>
        </div>

        <div className="mb-8 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
            🔍
          </div>
          <Input
            placeholder="Search for phones and accessories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 text-lg"
          />
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map((c) => {
            const active = activeCategory === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className={`px-4 py-2 rounded-full border text-sm transition-all ${active ? "bg-[#1f4b99] border-[#1f4b99] text-white" : "bg-white border-slate-200 text-slate-700 hover:border-[#1f4b99]"}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-700">
            Sort by:
          </label>

          <div className="relative" ref={sortRef}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              onClick={() => setSortOpen((s) => !s)}
              className="w-56 rounded-full border-2 border-slate-200 bg-white px-4 py-2 pr-10 text-sm font-medium text-slate-900 focus:border-[#1f4b99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f4b99] shadow-sm hover:border-slate-300 transition-colors flex items-center justify-between"
            >
              <span>
                {sortBy === "default"
                  ? "Default"
                  : sortBy === "top-reviewed"
                    ? "Top Reviewed"
                    : sortBy === "price-low"
                      ? "Price: Low to High"
                      : "Price: High to Low"}
              </span>
              <svg
                className="w-4 h-4 text-slate-500 ml-2"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 8l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {sortOpen && (
              <ul
                role="listbox"
                aria-label="Sort products"
                tabIndex={-1}
                className="absolute mt-2 w-56 bg-white rounded-lg border border-slate-200 shadow-lg z-50 overflow-hidden"
              >
                <li
                  role="option"
                  aria-selected={sortBy === "default"}
                  onClick={() => {
                    setSortBy("default");
                    setSortOpen(false);
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-slate-100 ${sortBy === "default" ? "bg-slate-100 font-medium" : ""}`}
                >
                  Default
                </li>
                <li
                  role="option"
                  aria-selected={sortBy === "top-reviewed"}
                  onClick={() => {
                    setSortBy("top-reviewed");
                    setSortOpen(false);
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-slate-100 ${sortBy === "top-reviewed" ? "bg-slate-100 font-medium" : ""}`}
                >
                  Top Reviewed
                </li>
                <li
                  role="option"
                  aria-selected={sortBy === "price-low"}
                  onClick={() => {
                    setSortBy("price-low");
                    setSortOpen(false);
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-slate-100 ${sortBy === "price-low" ? "bg-slate-100 font-medium" : ""}`}
                >
                  Price: Low to High
                </li>
                <li
                  role="option"
                  aria-selected={sortBy === "price-high"}
                  onClick={() => {
                    setSortBy("price-high");
                    setSortOpen(false);
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-slate-100 ${sortBy === "price-high" ? "bg-slate-100 font-medium" : ""}`}
                >
                  Price: High to Low
                </li>
              </ul>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-600">
            Loading products…
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📱</div>
            <p className="text-slate-600 text-base">
              {search.trim()
                ? "No products found. Try a different search."
                : "No products available right now."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sorted
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={() => openModal(p)}
                  />
                ))}
            </div>

            {Math.ceil(sorted.length / pageSize) > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-sm font-semibold hover:border-[#1f4b99] disabled:opacity-50"
                >
                  ← Prev
                </button>
                {Array.from({
                  length: Math.ceil(sorted.length / pageSize),
                }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setCurrentPage(i + 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`px-3 py-1 rounded-lg border text-sm font-semibold ${currentPage === i + 1 ? "bg-[#1f4b99] text-white border-[#1f4b99]" : "bg-white border-slate-200 text-slate-700 hover:border-[#1f4b99]"}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) =>
                      Math.min(Math.ceil(sorted.length / pageSize), p + 1),
                    );
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={currentPage === Math.ceil(sorted.length / pageSize)}
                  className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-sm font-semibold hover:border-[#1f4b99] disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </Container>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {selectedProduct.category || "Uncategorized"}
                </p>
                <h3 className="text-xl font-semibold text-slate-900">
                  {selectedProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-900 text-xl font-semibold">
              £{modalPrice.toFixed(2)}
            </p>

            {selectedProduct.variations &&
              selectedProduct.variations.length > 0 && (
                <div className="space-y-3">
                  <p className="text-slate-900 font-medium text-base">
                    Select variations
                  </p>
                  <div className="space-y-3">
                    {selectedProduct.variations.map((v) => (
                      <div key={v.name} className="space-y-2">
                        <p className="text-slate-700 text-sm font-medium">
                          {v.name}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(v.options || []).map((opt: RawOption) => {
                            const value = getOptionValue(opt);
                            const active = selectedVariations[v.name] === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => {
                                  setSelectedVariations((prev) => ({
                                    ...prev,
                                    [v.name]: value,
                                  }));
                                  const p = getOptionPrice(opt);
                                  if (typeof p === "number") setModalPrice(p);
                                  else setModalPrice(selectedProduct.price);
                                }}
                                className={`px-3 py-2 rounded-lg border text-sm transition-all ${active ? "bg-[#1f4b99] border-[#1f4b99] text-white" : "bg-white border-slate-200 text-slate-700 hover:border-[#1f4b99]"}`}
                              >
                                {value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="flex items-center gap-3">
              <label className="text-slate-700 text-sm">Quantity</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedProduct(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 hover:border-[#1f4b99]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdd}
                className="flex-1 px-4 py-3 rounded-xl bg-[#1f4b99] text-white font-semibold disabled:opacity-50"
                disabled={modalNeedsVariations && !modalAllSelected}
              >
                {modalNeedsVariations && !modalAllSelected
                  ? "Select all variations"
                  : "Add to cart"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
