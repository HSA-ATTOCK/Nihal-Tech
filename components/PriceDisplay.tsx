import { getDiscountInfo } from "@/lib/discount";

type PriceDisplayProps = {
  price: number;
  originalPrice?: number | null;
  isDiscounted?: boolean | null;
  containerClassName?: string;
  saleClassName?: string;
  originalClassName?: string;
  badgeClassName?: string;
  showBadge?: boolean;
};

export default function PriceDisplay({
  price,
  originalPrice,
  isDiscounted,
  containerClassName = "",
  saleClassName = "",
  originalClassName = "",
  badgeClassName = "",
  showBadge = true,
}: PriceDisplayProps) {
  const discount = getDiscountInfo({
    salePrice: price,
    originalPrice,
    isDiscounted,
  });

  return (
    <div className={`flex flex-wrap items-center gap-2 ${containerClassName}`}>
      <span className={saleClassName}>£{discount.salePrice.toFixed(2)}</span>
      {discount.isDiscounted && discount.originalPrice ? (
        <>
          <span
            className={`text-sm text-slate-400 line-through decoration-2 decoration-slate-400/80 ${originalClassName}`}
          >
            £{discount.originalPrice.toFixed(2)}
          </span>
          {showBadge && discount.discountPercent !== null ? (
            <span
              className={`inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-rose-700 ${badgeClassName}`}
            >
              -{discount.discountPercent}%
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
