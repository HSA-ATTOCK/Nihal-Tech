"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Container from "@/components/Container";
import Button from "@/components/Button";
import { useSession } from "next-auth/react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string;
  imageUrl?: string;
  imageUrls?: string[];
  variations?: Array<{ name: string; options: string[] }>;
}

interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  user?: { name: string | null; email: string | null } | null;
}

interface Question {
  id: string;
  question: string;
  createdAt: string;
  user?: { name: string | null; email: string | null } | null;
  answers: Array<{
    id: string;
    body: string;
    createdAt: string;
    user?: { name: string | null; email: string | null } | null;
  }>;
}

interface BundleItem {
  productId?: string;
  quantity?: number;
  product?: Product | null;
}

interface Bundle {
  id: string;
  name: string;
  description?: string | null;
  items: BundleItem[];
  priceOverride?: number | null;
}

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedVariations, setSelectedVariations] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState({ average: 0, count: 0 });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxOffset, setLightboxOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragMoved = useRef(false);
  const dragStart = useRef<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to load product");
        const data = await res.json();
        setProduct(data);
        const primary = data.imageUrls?.[0] || data.imageUrl || null;
        setActiveImage(primary);
        // initialize selections with empty entries for required variations
        if (Array.isArray(data.variations)) {
          const blank: Record<string, string> = {};
          data.variations.forEach((v: { name: string }) => {
            blank[v.name] = "";
          });
          setSelectedVariations(blank);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params?.id]);

  useEffect(() => {
    if (!product || status !== "authenticated") return;

    const checkWishlist = async () => {
      const res = await fetch(`/api/wishlist/${product.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setInWishlist(Boolean(data?.inWishlist));
    };

    checkWishlist();
  }, [product, status]);

  useEffect(() => {
    if (!product || status !== "authenticated") return;

    fetch("/api/recently-viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    }).catch(() => {});
  }, [product, status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/recently-viewed")
      .then((res) => (res.ok ? res.json() : []))
      .then((items: Array<{ product: Product }>) => {
        const mapped = (items || [])
          .map((i) => i.product)
          .filter((p) => p && p.id !== product?.id);
        setRecentlyViewed(mapped as Product[]);
      })
      .catch(() => {});
  }, [status, product?.id]);

  useEffect(() => {
    if (!product) return;

    fetch(`/api/reviews?productId=${product.id}`)
      .then((res) =>
        res.ok ? res.json() : { reviews: [], average: 0, count: 0 },
      )
      .then((data) => {
        setReviews(data.reviews || []);
        setReviewSummary({
          average: data.average || 0,
          count: data.count || 0,
        });
      })
      .catch(() => {});

    fetch(`/api/questions?productId=${product.id}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Question[]) => setQuestions(data || []))
      .catch(() => {});

    fetch(`/api/bundles?productId=${product.id}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Bundle[]) => setBundles(data || []))
      .catch(() => {});
  }, [product]);

  useEffect(() => {
    const handleWindowMouseUp = () => {
      if (isDragging) onDragEnd();
    };
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => window.removeEventListener("mouseup", handleWindowMouseUp);
  }, [isDragging]);

  const handleAddToCart = async () => {
    if (!product) return;
    const needsSelection = (product.variations || []).length > 0;
    if (needsSelection) {
      const unselected = Object.entries(selectedVariations).some(
        ([, value]) => !value,
      );
      if (unselected) {
        alert("Please select all variations first");
        return;
      }
    }
    if (quantity <= 0) {
      alert("Quantity must be at least 1");
      return;
    }
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/product/${product.id}`);
      return;
    }

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          selectedVariations,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Could not add to cart");
      }
      alert("Added to cart!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not add to cart");
    }
  };

  const toggleWishlist = async () => {
    if (!product) return;
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/product/${product.id}`);
      return;
    }

    setWishlistLoading(true);
    try {
      if (inWishlist) {
        const res = await fetch(`/api/wishlist/${product.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Could not update wishlist");
        setInWishlist(false);
      } else {
        const res = await fetch(`/api/wishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        });
        if (!res.ok) throw new Error("Could not update wishlist");
        setInWishlist(true);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Wishlist update failed");
    } finally {
      setWishlistLoading(false);
    }
  };

  const submitQuestion = async () => {
    if (!product) return;
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/product/${product.id}`);
      return;
    }
    if (!questionText.trim()) {
      alert("Please enter a question");
      return;
    }

    setQuestionSubmitting(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          question: questionText.trim(),
        }),
      });
      if (!res.ok) throw new Error("Could not post question");
      const created: Question = await res.json();
      setQuestions((prev) => [created, ...prev]);
      setQuestionText("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not post question");
    } finally {
      setQuestionSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Loading product...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        {error || "Product not found"}
      </div>
    );
  }

  const images = product.imageUrls?.length
    ? product.imageUrls
    : product.imageUrl
      ? [product.imageUrl]
      : [];

  const activeImageIndex = Math.max(
    0,
    images.findIndex((img) => img === activeImage),
  );

  const openLightbox = () => {
    if (!images.length) return;
    setLightboxIndex(activeImageIndex >= 0 ? activeImageIndex : 0);
    setLightboxZoom(1);
    setLightboxOffset({ x: 0, y: 0 });
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxZoom(1);
    setLightboxOffset({ x: 0, y: 0 });
    setLightboxOpen(false);
  };

  const nextLightbox = () => {
    if (!images.length) return;
    setLightboxIndex((idx) => (idx + 1) % images.length);
  };

  const prevLightbox = () => {
    if (!images.length) return;
    setLightboxIndex((idx) => (idx - 1 + images.length) % images.length);
  };

  const reviewDisplay = showAllReviews ? reviews : reviews.slice(0, 3);
  const questionDisplay = showAllQuestions ? questions : questions.slice(0, 3);
  const showLightboxNav = images.length > 1;
  const clampOffset = (value: number, zoom: number) => {
    const maxOffset = Math.max(0, (zoom - 1) * 500);
    return Math.min(Math.max(value, -maxOffset), maxOffset);
  };

  const setZoom = (next: number) => {
    const clamped = Math.min(Math.max(next, 1), 5);
    setLightboxZoom(clamped);
    if (clamped === 1) {
      setLightboxOffset({ x: 0, y: 0 });
    } else {
      setLightboxOffset((prev) => ({
        x: clampOffset(prev.x, clamped),
        y: clampOffset(prev.y, clamped),
      }));
    }
  };

  const increaseZoom = () => setZoom(lightboxZoom + 0.5);
  const decreaseZoom = () => setZoom(lightboxZoom - 0.5);

  const onWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setZoom(lightboxZoom + delta);
  };

  const onDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (lightboxZoom <= 1) return;
    e.preventDefault();
    dragMoved.current = false;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: lightboxOffset.x,
      offsetY: lightboxOffset.y,
    };
  };

  const onDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart.current) return;
    const dx = (e.clientX - dragStart.current.x) * 1.2;
    const dy = (e.clientY - dragStart.current.y) * 1.2;
    if (Math.abs(dx) + Math.abs(dy) > 2) {
      dragMoved.current = true;
    }
    setLightboxOffset({
      x: clampOffset(dragStart.current.offsetX + dx, lightboxZoom),
      y: clampOffset(dragStart.current.offsetY + dy, lightboxZoom),
    });
  };

  const onDragEnd = () => {
    setIsDragging(false);
    dragStart.current = null;
  };

  const onLightboxClick = () => {
    if (isDragging || dragMoved.current) {
      dragMoved.current = false;
      return;
    }
    increaseZoom();
    dragMoved.current = false;
  };

  const allVariationsSelected = (product.variations || []).every(
    (v) => selectedVariations[v.name],
  );

  return (
    <div className="min-h-screen py-12">
      <Container>
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div
              className="relative w-full aspect-4/3 bg-white border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center shadow-sm cursor-zoom-in"
              onClick={openLightbox}
            >
              {activeImage ? (
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="text-slate-500">No image</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {images.map((img) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(img)}
                    className={`relative h-20 bg-white border rounded-xl overflow-hidden ${activeImage === img ? "border-[#1f4b99]" : "border-slate-200"}`}
                  >
                    <Image
                      src={img}
                      alt="thumb"
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {product.category || "Uncategorized"}
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              {product.name}
            </h1>
            <p className="text-slate-700 leading-relaxed text-base">
              {product.description}
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              £{product.price}
            </p>
            <p className="text-slate-600 text-sm">In stock: {product.stock}</p>

            {product.variations && product.variations.length > 0 && (
              <div className="space-y-3 mt-4">
                <h3 className="text-slate-900 font-medium text-base">
                  Select variations
                </h3>
                <div className="space-y-3">
                  {product.variations.map((v) => (
                    <div
                      key={v.name}
                      className="bg-white border border-slate-200 rounded-xl p-3 text-slate-700 space-y-2"
                    >
                      <p className="font-medium text-slate-900 text-sm">
                        {v.name}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {v.options.map((opt) => {
                          const active = selectedVariations[v.name] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setSelectedVariations((prev) => ({
                                  ...prev,
                                  [v.name]: opt,
                                }))
                              }
                              className={`px-3 py-2 rounded-lg border text-sm transition-all ${active ? "bg-[#1f4b99] border-[#1f4b99] text-white" : "bg-white border-slate-200 text-slate-700 hover:border-[#1f4b99]"}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
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

            <div className="pt-2 flex items-center gap-3">
              <Button
                onClick={handleAddToCart}
                className="text-lg w-full md:w-auto"
                disabled={
                  !!product.variations?.length && !allVariationsSelected
                }
              >
                {product.variations?.length && !allVariationsSelected
                  ? "Select all variations"
                  : "Add to Cart"}
              </Button>
              <Button
                onClick={toggleWishlist}
                className={`w-11 h-11 p-0 flex items-center justify-center text-lg ${inWishlist ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                disabled={wishlistLoading}
                title={
                  wishlistLoading
                    ? "Updating wishlist"
                    : inWishlist
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                }
                ariaLabel={
                  wishlistLoading
                    ? "Updating wishlist"
                    : inWishlist
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                }
              >
                <span aria-hidden>{inWishlist ? "★" : "☆"}</span>
                <span className="sr-only">
                  {inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                </span>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-slate-900">Reviews</p>

                {lightboxOpen && images.length > 0 && (
                  <div
                    className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center px-4"
                    role="dialog"
                    aria-modal="true"
                  >
                    <button
                      type="button"
                      onClick={closeLightbox}
                      className="absolute top-4 right-4 text-white text-2xl font-semibold"
                      aria-label="Close image"
                    >
                      ×
                    </button>
                    {showLightboxNav && (
                      <button
                        type="button"
                        onClick={prevLightbox}
                        className="absolute left-4 text-white text-3xl font-bold px-3 py-2 bg-black/40 rounded-full hover:bg-black/60"
                        aria-label="Previous image"
                      >
                        ‹
                      </button>
                    )}
                    <div
                      className="relative w-full max-w-4xl aspect-4/3 cursor-zoom-in"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLightboxClick();
                      }}
                      onWheel={(e) => {
                        e.stopPropagation();
                        onWheelZoom(e);
                      }}
                      onMouseDown={onDragStart}
                      onMouseMove={onDragMove}
                      onMouseUp={onDragEnd}
                      onMouseLeave={onDragEnd}
                    >
                      <Image
                        src={images[lightboxIndex]}
                        alt={product.name}
                        fill
                        className="object-contain"
                        draggable={false}
                        style={{
                          transform: `translate(${lightboxOffset.x}px, ${lightboxOffset.y}px) scale(${lightboxZoom})`,
                          transformOrigin: "center",
                          cursor: lightboxZoom > 1 ? "grab" : "zoom-in",
                          willChange: "transform",
                        }}
                        sizes="(min-width: 1024px) 70vw, 100vw"
                      />
                    </div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 text-white rounded-full px-3 py-2 text-sm">
                      <button
                        type="button"
                        onClick={decreaseZoom}
                        className="px-2 font-semibold"
                        aria-label="Zoom out"
                      >
                        −
                      </button>
                      <span className="min-w-12 text-center">
                        {(lightboxZoom * 100).toFixed(0)}%
                      </span>
                      <button
                        type="button"
                        onClick={increaseZoom}
                        className="px-2 font-semibold"
                        aria-label="Zoom in"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoom(1)}
                        className="ml-2 px-2 text-xs border border-white/50 rounded-full"
                      >
                        Reset
                      </button>
                    </div>
                    {showLightboxNav && (
                      <button
                        type="button"
                        onClick={nextLightbox}
                        className="absolute right-4 text-white text-3xl font-bold px-3 py-2 bg-black/40 rounded-full hover:bg-black/60"
                        aria-label="Next image"
                      >
                        ›
                      </button>
                    )}
                  </div>
                )}
                <p className="text-slate-600 text-sm">
                  Average {reviewSummary.average.toFixed(1)} / 5 ·{" "}
                  {reviewSummary.count} review
                  {reviewSummary.count === 1 ? "" : "s"}
                </p>
              </div>
              <div
                className="text-amber-500 text-xl"
                aria-label="Average rating"
              >
                {"★".repeat(Math.round(reviewSummary.average)) || "☆"}
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="text-slate-600 text-sm">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviewDisplay.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span className="text-amber-500">
                        {"★".repeat(r.rating)}
                      </span>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="font-semibold text-slate-900 mt-1">
                      {r.title}
                    </p>
                    <p className="text-slate-700 text-sm mt-1">{r.body}</p>
                    {r.user?.name && (
                      <p className="text-xs text-slate-500 mt-1">
                        by {r.user.name}
                      </p>
                    )}
                  </div>
                ))}
                {reviews.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllReviews((prev) => !prev)}
                    className="text-sm font-semibold text-[#1f4b99] hover:text-[#163a79]"
                  >
                    {showAllReviews ? "Hide" : "See more"}
                  </button>
                )}
              </div>
            )}
            <div className="border-t border-slate-200 pt-4 space-y-2">
              <p className="font-semibold text-slate-900">Reviews</p>
              <p className="text-sm text-slate-600">
                Reviews can only be submitted from your delivered orders. Head
                to your order details to leave feedback once an item is
                delivered.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Questions & Answers
                </p>
                <p className="text-slate-600 text-sm">
                  Ask about specs, compatibility, or repairs.
                </p>
              </div>
            </div>

            {questions.length === 0 ? (
              <p className="text-slate-600 text-sm">
                No questions yet. Ask the first one.
              </p>
            ) : (
              <div className="space-y-3">
                {questionDisplay.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                      {q.user?.name && <span>by {q.user.name}</span>}
                    </div>
                    <p className="text-slate-900 font-semibold">
                      Q: {q.question}
                    </p>
                    {q.answers.length === 0 ? (
                      <p className="text-sm text-slate-600">Awaiting answer</p>
                    ) : (
                      <div className="space-y-2">
                        {q.answers.map((a) => (
                          <div
                            key={a.id}
                            className="rounded-lg bg-white border border-slate-200 p-3 text-sm text-slate-800"
                          >
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>Answer</span>
                              <span>
                                {new Date(a.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-1">{a.body}</p>
                            {a.user?.name && (
                              <p className="text-[11px] text-slate-500 mt-1">
                                by {a.user.name}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {questions.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllQuestions((prev) => !prev)}
                    className="text-sm font-semibold text-[#1f4b99] hover:text-[#163a79]"
                  >
                    {showAllQuestions ? "Hide" : "See more"}
                  </button>
                )}
              </div>
            )}

            <div className="border-t border-slate-200 pt-4 space-y-3">
              <p className="font-semibold text-slate-900">Ask a question</p>
              {status === "authenticated" ? (
                <>
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1f4b99] focus:outline-none"
                    placeholder="Is this compatible with..."
                  />
                  <Button
                    onClick={submitQuestion}
                    disabled={questionSubmitting}
                    className="text-sm"
                  >
                    {questionSubmitting ? "Sending..." : "Submit question"}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-slate-600">
                  Please log in to submit a question.
                </p>
              )}
            </div>
          </div>
        </div>

        {bundles.length > 0 && (
          <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Frequently bought together
                </p>
                <p className="text-slate-600 text-sm">
                  Curated bundles with better value.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {bundles.map((bundle) => {
                const total = bundle.items.reduce((sum, i) => {
                  const price = i.product?.price || 0;
                  const qty = i.quantity || 1;
                  return sum + price * qty;
                }, 0);
                const displayTotal = bundle.priceOverride ?? total;
                return (
                  <div
                    key={bundle.id}
                    className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">
                        {bundle.name}
                      </p>
                      <p className="text-[#1f4b99] font-semibold">
                        £{displayTotal.toFixed(2)}
                      </p>
                    </div>
                    {bundle.description && (
                      <p className="text-sm text-slate-700">
                        {bundle.description}
                      </p>
                    )}
                    <ul className="text-sm text-slate-700 space-y-1">
                      {bundle.items.map((i, idx) => (
                        <li
                          key={`${bundle.id}-${idx}`}
                          className="flex items-center gap-2"
                        >
                          <span>•</span>
                          <span>
                            {i.product?.name || "Product"} × {i.quantity || 1}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {recentlyViewed.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Recently viewed
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recentlyViewed.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
                >
                  <div className="relative h-36 bg-slate-50 rounded-xl mb-3 overflow-hidden">
                    {item.imageUrls?.[0] || item.imageUrl ? (
                      <Image
                        src={item.imageUrls?.[0] || item.imageUrl || ""}
                        alt={item.name}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="text-slate-500 flex items-center justify-center h-full">
                        No image
                      </div>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">
                    {item.name}
                  </h4>
                  <p className="text-[#1f4b99] font-semibold text-base mt-1">
                    £{item.price}
                  </p>
                  <Button
                    onClick={() => router.push(`/product/${item.id}`)}
                    className="w-full mt-3 text-sm"
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
