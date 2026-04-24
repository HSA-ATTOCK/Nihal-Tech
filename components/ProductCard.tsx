import Image from "next/image";
import Link from "next/link";
import Button from "./Button";
import { RawOption } from "@/lib/types";
import { buildInternalHref } from "@/lib/navigation";
import PriceDisplay from "./PriceDisplay";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  isDiscounted?: boolean | null;
  imageUrl?: string;
  imageUrls?: string[];
  variations?: Array<{ name: string; options?: RawOption[] }>;
  buyOneGetOneFree?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
  returnTo?: string;
  anchorId?: string;
}

export default function ProductCard({
  product,
  onAddToCart,
  returnTo,
  anchorId,
}: ProductCardProps) {
  const fallback =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300" fill="none"><rect width="300" height="300" fill="url(#g)"/><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23eef2f9"/><stop offset="100%" stop-color="%23d4ddf0"/></linearGradient></defs></svg>',
    );

  const primaryImage = product.imageUrls?.[0] || product.imageUrl || fallback;

  const computeDisplayPrice = () => {
    const prices: number[] = [];
    (product.variations || []).forEach((v) => {
      (v.options || []).forEach((opt) => {
        if (typeof opt === "object" && typeof opt.price === "number")
          prices.push(opt.price);
      });
    });
    return prices.length ? Math.min(...prices) : product.price;
  };

  const displayPrice = computeDisplayPrice();
  const productHref = buildInternalHref(`/product/${product.id}`, {
    returnTo,
  });

  return (
    <div
      id={anchorId}
      className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-5 group flex flex-col h-full"
    >
      <Link href={productHref} className="block flex-1">
        <div className="relative overflow-hidden rounded-xl mb-4 bg-slate-50 p-4 border border-slate-100">
          <Image
            src={primaryImage}
            alt={product.name}
            width={192}
            height={192}
            unoptimized
            className="h-48 mx-auto object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <h3 className="font-semibold text-slate-900 text-lg mt-3 group-hover:text-[#1f4b99] transition-all duration-200 line-clamp-2">
          {product.name}
        </h3>
      </Link>

      <div className="mt-4 flex flex-col gap-3">
        <PriceDisplay
          price={displayPrice}
          originalPrice={product.originalPrice}
          isDiscounted={product.isDiscounted}
          containerClassName="items-end"
          saleClassName="text-[#1f4b99] font-semibold text-xl relative"
        />
        {product.buyOneGetOneFree ? (
          <span className="inline-block w-fit rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
            Buy 1 Get 1 FREE
          </span>
        ) : null}
        <Button onClick={onAddToCart} className="w-full mt-auto text-sm">
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
