"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/Button";

type WishlistItem = {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    imageUrls?: string[];
  };
};

export default function WishlistClient({
  initialItems,
}: {
  initialItems: WishlistItem[];
}) {
  const [items, setItems] = useState<WishlistItem[]>(initialItems);
  const [removing, setRemoving] = useState<Record<string, boolean>>({});

  const handleRemove = async (productId: string) => {
    setRemoving((prev) => ({ ...prev, [productId]: true }));
    try {
      const res = await fetch(`/api/wishlist/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove");
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not remove item");
    } finally {
      setRemoving((prev) => ({ ...prev, [productId]: false }));
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-900 mb-2">
          No saved items yet
        </p>
        <p className="text-slate-600 mb-6">
          Save products to quickly find them later.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {items.map((item) => {
        const image = item.product.imageUrls?.[0] || item.product.imageUrl;
        return (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col"
          >
            <div className="relative h-40 bg-slate-50 rounded-xl mb-3 overflow-hidden">
              {image ? (
                <Image
                  src={image}
                  alt={item.product.name}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="text-slate-500 flex items-center justify-center h-full">
                  No image
                </div>
              )}
            </div>
            <h3 className="font-semibold text-slate-900 text-sm line-clamp-2">
              {item.product.name}
            </h3>
            <p className="text-[#1f4b99] font-semibold text-base mt-1">
              £{item.product.price}
            </p>
            <div className="mt-auto pt-3 flex flex-col gap-2">
              <Button
                onClick={() => handleRemove(item.product.id)}
                disabled={removing[item.product.id]}
                className="text-sm"
              >
                {removing[item.product.id] ? "Removing..." : "Remove"}
              </Button>
              <Link
                href={`/product/${item.product.id}`}
                className="w-full text-center rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
              >
                View product
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
