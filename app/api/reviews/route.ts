import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return Response.json({ message: "productId is required" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: { productId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const count = reviews.length;
  const average =
    count === 0
      ? 0
      : reviews.reduce((sum, r) => sum + r.rating, 0) / Math.max(count, 1);

  return Response.json({
    average,
    count,
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      createdAt: r.createdAt,
      user: r.user ? { name: r.user.name, email: r.user.email } : null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { productId, rating, title, review } = body as {
    productId?: string;
    rating?: number;
    title?: string;
    review?: string;
  };

  if (!productId || !rating || !title || !review) {
    return Response.json({ message: "Missing fields" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return Response.json({ message: "Rating must be 1-5" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product)
    return Response.json({ message: "Product not found" }, { status: 404 });

  const saved = await prisma.review.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    update: { rating, title, body: review },
    create: { userId: user.id, productId, rating, title, body: review },
    include: { user: true },
  });

  return Response.json({
    id: saved.id,
    rating: saved.rating,
    title: saved.title,
    body: saved.body,
    createdAt: saved.createdAt,
    user: saved.user
      ? { name: saved.user.name, email: saved.user.email }
      : null,
  });
}
