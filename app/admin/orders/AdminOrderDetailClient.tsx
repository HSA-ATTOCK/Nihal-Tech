"use client";
// Use string for role in client components to avoid enum conflicts
import Link from "next/link";
import { useState, useTransition } from "react";
import type {
  OrderComment,
  OrderItem,
  ReturnRequest,
} from "@/app/orders/OrderDetailClient";

export type AdminOrderDetail = {
  id: string;
  total: number;
  status: string;
  shippingName: string;
  shippingEmail: string;
  phone: string;
  shippingAddress: string;
  items: OrderItem[];
  createdAt: string;
  comments: OrderComment[];
  user?: { email: string; name: string | null } | null;
  returns?: ReturnRequest[];
};

const STATUS_OPTIONS = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Return request accepted",
  "Returned",
  "Cancelled",
];

export default function AdminOrderDetailClient({
  order,
}: {
  order: AdminOrderDetail;
}) {
  type ApiOrderComment = Omit<OrderComment, "createdByRole"> & {
    createdByRole?: string;
    authorRole?: string;
    user?: { email?: string | null } | null;
  };

  const [status, setStatus] = useState(order.status);
  const [comments, setComments] = useState(order.comments || []);
  const [returnRequests, setReturnRequests] = useState(order.returns || []);
  const [message, setMessage] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [returnSavingId, setReturnSavingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      setMessage(null);
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          comment: commentInput.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json?.message || "Update failed");
        return;
      }
      setStatus(json.status || status);
      const incomingComments =
        (json.comments as ApiOrderComment[] | undefined) ?? [];
      const normalized = incomingComments.map((c) => ({
        ...c,
        createdByRole: c.createdByRole ?? c.authorRole ?? "ADMIN",
        createdByEmail: c.createdByEmail ?? c.user?.email ?? null,
      }));
      setComments(normalized.length ? normalized : comments);
      setCommentInput("");
      setMessage("Order updated");
    });
  };

  const updateReturn = (returnId: string, nextStatus: string) => {
    setReturnSavingId(returnId);
    setMessage(null);
    fetch(`/api/orders/${order.id}/returns`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnId, status: nextStatus }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Update failed");
        setReturnRequests(data.returns || returnRequests);
        if (data.orderStatus) setStatus(data.orderStatus);
        setMessage("Return request updated");
      })
      .catch((err: unknown) => {
        setMessage(err instanceof Error ? err.message : "Update failed");
      })
      .finally(() => setReturnSavingId(null));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Admin · Order
          </p>
          <h1 className="text-3xl font-bold text-slate-900">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="text-slate-600">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
        >
          Back
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Items</h2>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-800">
                {status}
              </span>
            </div>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={`${order.id}-${idx}`}
                  className="flex justify-between items-start rounded-xl border border-slate-200 px-3 py-2"
                >
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
                    £{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-4">
              <p className="text-sm text-slate-600">Total</p>
              <p className="text-2xl font-black text-[#1f4b99]">
                £{order.total.toFixed(2)}
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
                  {order.shippingName || order.user?.name || "-"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Email
                </p>
                <p className="text-slate-900 font-semibold">
                  {order.shippingEmail || order.user?.email || "-"}
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
                  Address
                </p>
                <p className="text-slate-900 font-semibold whitespace-pre-wrap">
                  {order.shippingAddress || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Status & notes
              </h3>
              <p className="text-sm text-slate-600">
                Update status and leave internal comments.
              </p>
            </div>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-[#1f4b99] focus:outline-none"
              disabled={isPending}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Add admin comment
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-[#1f4b99] focus:outline-none"
              placeholder="What changed?"
              disabled={isPending}
            />
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="rounded-full bg-[#1f4b99] px-5 py-2 text-sm font-semibold text-white hover:bg-[#163a79] disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus(order.status);
                setCommentInput("");
                setMessage(null);
              }}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
            >
              Reset
            </button>
          </div>

          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-800">Comments</h4>
              <span className="text-xs text-slate-500">
                {comments.length} entries
              </span>
            </div>
            {comments.length === 0 ? (
              <p className="text-sm text-slate-600">No comments yet.</p>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>
                        {c.createdByRole === "ADMIN" ? "Admin" : "Client"}
                      </span>
                      <span>{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-800 mt-1">{c.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-800">
                Return requests
              </h4>
              <span className="text-xs text-slate-500">
                {returnRequests.length} entries
              </span>
            </div>
            {returnRequests.length === 0 ? (
              <p className="text-sm text-slate-600">No return requests.</p>
            ) : (
              <div className="space-y-3">
                {returnRequests.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                  >
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{r.rmaNumber}</span>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="font-semibold text-slate-900">
                      Status: {r.status}
                    </p>
                    <p className="text-sm">Reason: {r.reason}</p>
                    {r.notes && (
                      <p className="text-xs text-slate-600">Notes: {r.notes}</p>
                    )}
                    {!["returned", "declined"].includes(
                      r.status.toLowerCase(),
                    ) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => updateReturn(r.id, "accepted")}
                          disabled={returnSavingId === r.id}
                          className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {returnSavingId === r.id ? "Updating..." : "Accept"}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateReturn(r.id, "returned")}
                          disabled={returnSavingId === r.id}
                          className="rounded-full bg-[#1f4b99] px-3 py-1 text-xs font-semibold text-white hover:bg-[#163a79] disabled:opacity-60"
                        >
                          {returnSavingId === r.id
                            ? "Updating..."
                            : "Mark Returned"}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateReturn(r.id, "declined")}
                          disabled={returnSavingId === r.id}
                          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                        >
                          {returnSavingId === r.id ? "Updating..." : "Decline"}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateReturn(r.id, "declined")}
                          disabled={returnSavingId === r.id}
                          className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        >
                          {returnSavingId === r.id
                            ? "Updating..."
                            : "Not Accept"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
