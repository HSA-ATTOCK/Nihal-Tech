export type RawOption =
  | string
  | { value: string; price?: number; imageUrl?: string };
export type Variation = { name: string; options?: RawOption[] };
export type ProductWithVariations = { price: number; variations?: Variation[] };
