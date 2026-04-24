export type DiscountInfo = {
  salePrice: number;
  originalPrice: number | null;
  discountPercent: number | null;
  isDiscounted: boolean;
};

export function getDiscountInfo({
  salePrice,
  originalPrice,
  isDiscounted,
}: {
  salePrice: number;
  originalPrice?: number | null;
  isDiscounted?: boolean | null;
}): DiscountInfo {
  const normalizedOriginalPrice =
    typeof originalPrice === "number" && originalPrice > salePrice
      ? originalPrice
      : null;
  const activeDiscount = Boolean(isDiscounted && normalizedOriginalPrice);

  if (!activeDiscount) {
    return {
      salePrice,
      originalPrice: null,
      discountPercent: null,
      isDiscounted: false,
    };
  }

  const original = normalizedOriginalPrice as number;

  const discountPercent = Math.round(((original - salePrice) / original) * 100);

  return {
    salePrice,
    originalPrice: normalizedOriginalPrice,
    discountPercent,
    isDiscounted: true,
  };
}
