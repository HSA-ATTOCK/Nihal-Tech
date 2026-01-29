import Image from "next/image";
import Link from "next/link";
import Button from "./Button";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  imageUrls?: string[];
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
}

export default function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  const fallback =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300" fill="none"><rect width="300" height="300" fill="url(#g)"/><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23eef2f9"/><stop offset="100%" stop-color="%23d4ddf0"/></linearGradient></defs></svg>',
    );

  const primaryImage = product.imageUrls?.[0] || product.imageUrl || fallback;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-5 group">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative overflow-hidden rounded-xl mb-4 bg-slate-50 p-4 border border-slate-100">
          <Image
            src={primaryImage}
            alt={product.name}
            width={192}
            height={192}
            className="h-48 mx-auto object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <h3 className="font-semibold text-slate-900 text-lg mt-3 group-hover:text-[#1f4b99] transition-all duration-200">
          {product.name}
        </h3>
        <p className="text-[#1f4b99] font-semibold text-xl mt-2">
          £{product.price}
        </p>
      </Link>
      <Button onClick={onAddToCart} className="w-full mt-4 text-sm">
        Add to Cart
      </Button>
    </div>
  );
}
