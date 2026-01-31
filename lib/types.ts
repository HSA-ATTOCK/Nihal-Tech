export type RawOption = string | { value: string; price?: number };
export type Variation = { name: string; options?: RawOption[] };
export type ProductWithVariations = { price: number; variations?: Variation[] };
