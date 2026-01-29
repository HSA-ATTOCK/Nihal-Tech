import OrderDetailClient, { OrderItem } from "../OrderDetailClient";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { Review } from "@prisma/client";

export const dynamic = "force-dynamic";

type SessionUser = { id?: string; email?: string | null };

export default async function OrderDetail({
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
          <p className="mb-6">Login to view your order.</p>
        </div>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-700 shadow-sm max-w-md w-full">
          <h2 className="text-3xl font-bold mb-3 text-slate-900">Orders</h2>
          <p className="mb-6">We could not find your account.</p>
        </div>
      </div>
    );
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      comments: { orderBy: { createdAt: "asc" }, include: { user: true } },
      user: true,
      invoice: true,
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

  const isOwner = order.userId === (session.user as SessionUser).id;
  if (!isOwner && user.role !== Role.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-700 shadow-sm max-w-md w-full">
          <h2 className="text-3xl font-bold mb-3 text-slate-900">
            Unauthorized
          </h2>
          <p className="mb-6">You do not have access to this order.</p>
        </div>
      </div>
    );
  }

  const items: OrderItem[] = Array.isArray(order.items)
    ? (order.items as unknown as OrderItem[])
    : [];

  const productIds = items.map((i) => i.productId).filter(Boolean) as string[];

  let userReviews: Record<string, Review> = {};
  if (productIds.length > 0) {
    const reviews = await prisma.review.findMany({
      where: { userId: user.id, productId: { in: productIds } },
      orderBy: { createdAt: "desc" },
    });
    userReviews = Object.fromEntries(reviews.map((r) => [r.productId, r]));
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-4xl">
        <OrderDetailClient
          order={{
            id: order.id,
            total: order.total,
            status: order.status,
            shippingName: order.shippingName,
            shippingEmail: order.shippingEmail,
            phone: order.phone,
            shippingAddress: order.shippingAddress,
            items: items.map((item) => {
              const review = item.productId
                ? userReviews[item.productId]
                : undefined;
              return {
                ...item,
                userReview: review
                  ? {
                      rating: review.rating,
                      review: review.body,
                      title: review.title,
                      createdAt: review.createdAt.toISOString(),
                    }
                  : undefined,
              } as OrderItem;
            }),
            createdAt: order.createdAt.toISOString(),
            deliveredAt: order.deliveredAt
              ? order.deliveredAt.toISOString()
              : null,
            comments: order.comments.map((c) => ({
              id: c.id,
              message: c.message,
              createdAt: c.createdAt.toISOString(),
              createdByRole: c.authorRole,
              createdByEmail: c.user?.email ?? null,
            })),
            invoiceNumber: order.invoice?.number || null,
            returns: order.returns.map((r) => ({
              id: r.id,
              status: r.status,
              reason: r.reason,
              notes: r.notes,
              rmaNumber: r.rmaNumber,
              createdAt: r.createdAt.toISOString(),
            })),
          }}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
