import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import Link from "next/link";

type SessionUser = { id?: string; email?: string | null };

export const dynamic = "force-dynamic";

export default async function Orders() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-700 shadow-sm max-w-md w-full">
          <h2 className="text-3xl font-bold mb-3 text-slate-900">Orders</h2>
          <p className="mb-6">Login or sign up to view your orders.</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login?callbackUrl=/orders"
              className="bg-[#1f4b99] text-white px-6 py-2.5 rounded-full hover:bg-[#163a79] transition-all duration-200 shadow-sm font-semibold"
            >
              Login
            </Link>
            <Link
              href="/signup?callbackUrl=/orders"
              className="px-6 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:border-[#1f4b99] transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId: (session.user as SessionUser).id || "" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
          <p className="text-slate-600">Track your purchases</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-700 shadow-sm">
            No orders yet.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const items = Array.isArray(o.items)
                ? (o.items as {
                    name?: string;
                    price?: number;
                    quantity?: number;
                    selectedVariations?: Record<string, string>;
                  }[])
                : [];
              return (
                <div
                  key={o.id}
                  className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-slate-900 font-semibold">
                        Order #{o.id.slice(0, 8)}
                      </p>
                      <p className="text-slate-600 text-sm">
                        {new Date(o.createdAt).toDateString()}
                      </p>
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800">
                        Status: {o.status}
                      </span>
                    </div>
                    <p className="text-[#1f4b99] font-bold text-xl">
                      £{o.total.toFixed(2)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 space-y-2">
                    <p className="font-semibold text-slate-900">Products</p>
                    {items.length === 0 ? (
                      <p className="text-slate-600">No item details stored.</p>
                    ) : (
                      <p className="text-slate-700">
                        {items
                          .map((item) => item.name)
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href={`/orders/${o.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
