import { Suspense } from "react";
import ProductRecycleBinClient from "./RecycleBinClient";

export default function ProductRecycleBinPage() {
  return (
    <Suspense fallback={null}>
      <ProductRecycleBinClient />
    </Suspense>
  );
}
