"use client";

import { Role } from "@prisma/client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type OrderItem = {
  name: string;
  quantity: number;
  price?: number | null;
  selectedVariations?: Record<string, string> | null;
  productId?: string | null;
  userReview?: {
    rating: number;
    review: string;
    title?: string | null;
    createdAt?: string | null;
  } | null;
};

export type OrderComment = {
  id: string;
  message: string;
  createdAt: string;
  createdByRole: Role;
  createdByEmail?: string | null;
};

export type ReturnRequest = {
  id: string;
  status: string;
  reason: string;
  notes?: string | null;
  rmaNumber: string;
  createdAt: string;
};

export type OrderDetail = {
  id: string;
  total: number;
  status: string;
  deliveredAt?: string | null;
  shippingName: string;
  shippingEmail: string;
  phone: string;
  shippingAddress: string;
  items: OrderItem[];
  createdAt: string;
  comments?: OrderComment[];
  returns?: ReturnRequest[];
  invoiceNumber?: string | null;
  isDelivered?: boolean;
  isOwner?: boolean;
};

type ReviewDraft = {
  rating: number;
  review: string;
  submitting?: boolean;
  submitted?: boolean;
};

export default function OrderDetailClient({
  order,
  isOwner: ownerOverride,
}: {
  order: OrderDetail;
  isOwner?: boolean;
}) {
  const isOwner = ownerOverride ?? order.isOwner ?? true;
  const isDelivered = order.status.toLowerCase() === "delivered";
  const formatDate = (input?: string | null) =>
    input
      ? new Date(input).toLocaleString("en-GB", { timeZone: "Europe/London" })
      : null;
  const deliveredDisplay = formatDate(order.deliveredAt);
  const isReturnWindowOpen = useMemo(() => {
    if (!order.deliveredAt) return false;
    const deliveredTime = new Date(order.deliveredAt).getTime();
    if (Number.isNaN(deliveredTime)) return false;
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    return Date.now() - deliveredTime <= threeDaysMs;
  }, [order.deliveredAt]);
  const [message, setMessage] = useState<string | null>(null);
  const [returnForm, setReturnForm] = useState({ reason: "", notes: "" });
  const [returns, setReturns] = useState<ReturnRequest[]>(order.returns || []);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>(
    {},
  );

  useEffect(() => {
    const seeded: Record<string, ReviewDraft> = {};
    order.items.forEach((item) => {
      if (!item.productId || !item.userReview) return;
      seeded[item.productId] = {
        rating: item.userReview.rating,
        review: item.userReview.review,
        submitted: true,
        submitting: false,
      };
    });
    if (Object.keys(seeded).length > 0) {
      setReviewDrafts((prev) => ({ ...seeded, ...prev }));
    }
  }, [order.items]);

  const submitReturn = async () => {
    setReturnSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: returnForm.reason.trim(),
          notes: returnForm.notes.trim() || undefined,
          items: order.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Return request failed");
      setReturns((prev) => [data, ...prev]);
      setReturnForm({ reason: "", notes: "" });
      setMessage(`Return requested. RMA: ${data.rmaNumber}`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Return request failed",
      );
    } finally {
      setReturnSubmitting(false);
    }
  };

  const updateReviewDraft = (
    productId: string,
    updates: Partial<ReviewDraft>,
  ) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [productId]: (() => {
        const next = { ...(prev[productId] ?? {}), ...updates };
        const { rating, review, ...rest } = next;
        return {
          ...rest,
          rating: rating ?? 5,
          review: review ?? "",
        };
      })(),
    }));
  };

  const submitReview = async (productId: string) => {
    const draft = reviewDrafts[productId];
    if (!draft || draft.submitted) return;

    const autoTitle = draft.review.trim().slice(0, 60) || "Review";

    updateReviewDraft(productId, { submitting: true, submitted: false });
    setMessage(null);
    try {
      const res = await fetch(`/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating: draft.rating,
          title: autoTitle,
          review: draft.review,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Review failed");
      updateReviewDraft(productId, { submitting: false, submitted: true });
      setMessage("Review submitted");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Review failed");
      updateReviewDraft(productId, { submitting: false });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Order
          </p>
          <h1 className="text-3xl font-bold text-slate-900">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="text-slate-600">Placed {formatDate(order.createdAt)}</p>
        </div>
        <Link
          href="/orders"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
        >
          Back to orders
        </Link>
      </div>

      {message && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Items</h2>
            <div className="space-y-3">
              {order.items.map((item, idx) => {
                const draft = item.productId
                  ? reviewDrafts[item.productId]
                  : undefined;
                const submitted = Boolean(draft?.submitted);

                return (
                  <div key={`${order.id}-${idx}`} className="space-y-3">
                    <div className="flex justify-between items-start rounded-xl border border-slate-200 px-3 py-2">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900 text-sm">
                          {item.name}
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
                                    key={`${order.id}-${idx}-${key}-${value}`}
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
                        {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </p>
                    </div>
                    {isOwner && isDelivered && item.productId && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        {!submitted && (
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-slate-900">
                              Leave a review
                            </p>
                          </div>
                        )}

                        {submitted ? (
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-900">
                              Your review
                            </p>
                            <p className="text-sm text-slate-700">
                              Rating: {draft?.rating ?? 5} / 5
                            </p>
                            <p className="text-sm text-slate-700 whitespace-pre-line">
                              {draft?.review || "No review text provided."}
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            <label className="text-xs font-semibold text-slate-700">
                              Rating
                              <select
                                value={
                                  reviewDrafts[item.productId!]?.rating ?? 5
                                }
                                onChange={(e) =>
                                  updateReviewDraft(item.productId!, {
                                    rating: Number(e.target.value),
                                  })
                                }
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1f4b99] focus:outline-none"
                              >
                                {[1, 2, 3, 4, 5].map((r) => (
                                  <option
                                    key={r}
                                    value={r}
                                  >{`${r} star${r > 1 ? "s" : ""}`}</option>
                                ))}
                              </select>
                            </label>
                            <textarea
                              value={
                                reviewDrafts[item.productId!]?.review ?? ""
                              }
                              onChange={(e) =>
                                updateReviewDraft(item.productId!, {
                                  review: e.target.value,
                                })
                              }
                              placeholder="Write your review"
                              rows={3}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1f4b99] focus:outline-none"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => submitReview(item.productId!)}
                                disabled={
                                  reviewDrafts[item.productId!]?.submitting
                                }
                                className="rounded-full bg-[#1f4b99] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163a79] disabled:opacity-60"
                              >
                                {reviewDrafts[item.productId!]?.submitting
                                  ? "Submitting..."
                                  : "Submit review"}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateReviewDraft(item.productId!, {
                                    rating: 5,
                                    review: "",
                                    submitting: false,
                                    submitted: false,
                                  })
                                }
                                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
                              >
                                Reset
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-4">
              <p className="text-sm text-slate-600">Total</p>
              <p className="text-2xl font-black text-[#1f4b99]">
                {order.total.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">Customer</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Name
                </p>
                <p className="text-slate-900 font-semibold">
                  {order.shippingName || "-"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Email
                </p>
                <p className="text-slate-900 font-semibold">
                  {order.shippingEmail || "-"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Phone
                </p>
                <p className="text-slate-900 font-semibold">
                  {order.phone || "-"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Shipping address
                </p>
                <p className="text-slate-900 font-semibold whitespace-pre-line">
                  {order.shippingAddress || "-"}
                </p>
              </div>
            </div>
          </div>

          {isOwner && isDelivered && isReturnWindowOpen && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Request a return
                  </h2>
                  <p className="text-sm text-slate-600">
                    Submit a return request if something went wrong (within 3
                    days of delivery).
                  </p>
                </div>
              </div>
              <div className="grid gap-3">
                <input
                  placeholder="Reason for return"
                  value={returnForm.reason}
                  onChange={(e) =>
                    setReturnForm((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1f4b99] focus:outline-none"
                />
                <textarea
                  placeholder="Additional notes (optional)"
                  value={returnForm.notes}
                  onChange={(e) =>
                    setReturnForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={3}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1f4b99] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={submitReturn}
                  disabled={returnSubmitting || !returnForm.reason.trim()}
                  className="rounded-full bg-[#1f4b99] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#163a79] disabled:opacity-60"
                >
                  {returnSubmitting ? "Submitting..." : "Submit return"}
                </button>
              </div>
            </div>
          )}
          {!isReturnWindowOpen && isDelivered && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              You cannot process a return for this order because it was
              delivered more than 3 days ago.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">Order</h2>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Status</p>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-800">
                {order.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Placed</p>
              <p className="text-sm font-semibold text-slate-900">
                {formatDate(order.createdAt)}
              </p>
            </div>
            {isDelivered && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Delivered</p>
                <p className="text-sm font-semibold text-slate-900">
                  {deliveredDisplay || "Marked delivered"}
                </p>
              </div>
            )}
            {order.invoiceNumber && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Invoice</p>
                <p className="text-sm font-semibold text-slate-900">
                  {order.invoiceNumber}
                </p>
              </div>
            )}
          </div>

          {returns.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">
                Return requests
              </h2>
              <div className="space-y-2">
                {returns.map((ret) => (
                  <div
                    key={ret.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">
                        {ret.reason}
                      </p>
                      <span className="text-xs rounded-full border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700">
                        {ret.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      RMA: {ret.rmaNumber}
                    </p>
                    {ret.notes && (
                      <p className="text-sm text-slate-700 mt-1">{ret.notes}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(ret.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.comments && order.comments.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">Updates</h2>
              <div className="space-y-3">
                {order.comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <p className="text-sm text-slate-900">{c.message}</p>
                    <p className="text-xs text-slate-500">
                      {c.createdByRole} {formatDate(c.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
