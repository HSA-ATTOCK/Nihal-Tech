import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  const orders = await prisma.order.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Admin
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            No orders yet.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(
              (o: {
                id: string;
                user?: { email?: string | null } | null;
                createdAt: Date | string;
                status: string;
                total: number;
              }) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="space-y-1">
                    <p className="text-slate-900 font-semibold">
                      Order #{o.id.slice(0, 8)}
                    </p>
                    <p className="text-slate-600 text-sm">{o.user?.email}</p>
                    <p className="text-slate-500 text-sm">
                      {new Date(o.createdAt).toLocaleString()}
                    </p>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800">
                      Status: {o.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold text-[#1f4b99]">
                      £{o.total.toFixed(2)}
                    </p>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
