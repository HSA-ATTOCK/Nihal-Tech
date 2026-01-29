import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import AdminOrderDetailClient from "../AdminOrderDetailClient";
import type { OrderItem } from "@/app/orders/OrderDetailClient";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-700 shadow-sm max-w-md w-full">
          <h2 className="text-3xl font-bold mb-3 text-slate-900">Orders</h2>
          <p className="mb-6">Login as admin to view this order.</p>
        </div>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-700 shadow-sm max-w-md w-full">
          <h2 className="text-3xl font-bold mb-3 text-slate-900">
            Unauthorized
          </h2>
          <p className="mb-6">You need admin access to view this order.</p>
        </div>
      </div>
    );
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      comments: { orderBy: { createdAt: "asc" }, include: { user: true } },
      returns: true,
    },
  });

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-700 shadow-sm max-w-md w-full">
          <h2 className="text-3xl font-bold mb-3 text-slate-900">Not found</h2>
          <p className="mb-6">We could not find this order.</p>
        </div>
      </div>
    );
  }

  const items: OrderItem[] = Array.isArray(order.items)
    ? (order.items as unknown as OrderItem[])
    : [];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-5xl">
        <AdminOrderDetailClient
          order={{
            id: order.id,
            total: order.total,
            status: order.status,
            shippingName: order.shippingName,
            shippingEmail: order.shippingEmail,
            phone: order.phone,
            shippingAddress: order.shippingAddress,
            items,
            createdAt: order.createdAt.toISOString(),
            comments: order.comments.map(
              (c: {
                id: string;
                message: string;
                createdAt: Date;
                authorRole: string;
                user?: { email?: string | null } | null;
              }) => ({
                id: c.id,
                message: c.message,
                createdAt: c.createdAt.toISOString(),
                createdByRole: c.authorRole,
                createdByEmail: c.user?.email ?? null,
              }),
            ),
            user: order.user
              ? { email: order.user.email, name: order.user.name }
              : null,
            returns: order.returns.map((r) => ({
              id: r.id,
              status: r.status,
              reason: r.reason,
              notes: r.notes,
              rmaNumber: r.rmaNumber,
              createdAt: r.createdAt.toISOString(),
            })),
          }}
        />
      </div>
    </div>
  );
}
