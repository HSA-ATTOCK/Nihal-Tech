import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import Link from "next/link";
import Container from "@/components/Container";
import WishlistClient from "./WishlistClient";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-700 shadow-sm max-w-md w-full">
          <h2 className="text-3xl font-bold mb-3 text-slate-900">Wishlist</h2>
          <p className="mb-6">Login or sign up to view your wishlist.</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login?callbackUrl=/wishlist"
              className="bg-[#1f4b99] text-white px-6 py-2.5 rounded-full hover:bg-[#163a79] transition-all duration-200 shadow-sm font-semibold"
            >
              Login
            </Link>
            <Link
              href="/signup?callbackUrl=/wishlist"
              className="px-6 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:border-[#1f4b99] transition-colors"
            >
              Sign Up
            </Link>
          </div>
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
          <h2 className="text-3xl font-bold mb-3 text-slate-900">Wishlist</h2>
          <p className="mb-6">We could not find your account.</p>
        </div>
      </div>
    );
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  const initialItems = items
    .filter((item) => item.product)
    .map((item) => ({
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        imageUrl: item.product.imageUrl,
        imageUrls: item.product.imageUrls,
      },
    }));

  return (
    <div className="min-h-screen py-12 px-4 bg-slate-50">
      <Container>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Wishlist
              </p>
              <h1 className="text-3xl font-bold text-slate-900">Saved items</h1>
              <p className="text-slate-600">
                Quick access to products you like.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
            >
              Continue shopping
            </Link>
          </div>

          <WishlistClient initialItems={initialItems} />
        </div>
      </Container>
    </div>
  );
}
