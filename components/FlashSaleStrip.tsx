"use client";

import Link from "next/link";

interface FlashSaleStripProps {
  href?: string;
  saleText?: string;
}

export default function FlashSaleStrip({
  href = "/shop?category=Vape",
  saleText = "🔥 FLASH SALE! Get up to 50% OFF on all vape products! Limited time offer! Don't miss out! ",
}: FlashSaleStripProps) {
  return (
    <Link href={href}>
      <div className="w-full bg-linear-to-r from-red-600 to-orange-600 py-3 cursor-pointer hover:from-red-700 hover:to-orange-700 transition-all duration-300 overflow-hidden">
        <div className="marquee-track">
          <div className="marquee-group text-white font-bold text-sm md:text-base">
            <span>{saleText}</span>
            <span>{saleText}</span>
            <span>{saleText}</span>
          </div>
          <div
            className="marquee-group text-white font-bold text-sm md:text-base"
            aria-hidden="true"
          >
            <span>{saleText}</span>
            <span>{saleText}</span>
            <span>{saleText}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .marquee-track {
          width: max-content;
          display: flex;
          flex-wrap: nowrap;
          animation: marquee 14s linear infinite;
          will-change: transform;
        }
        .marquee-group {
          display: flex;
          flex-wrap: nowrap;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .marquee-group span {
          padding-right: 2rem;
        }
      `}</style>
    </Link>
  );
}
