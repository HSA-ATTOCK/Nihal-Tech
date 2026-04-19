import cloudinary from "@/lib/cloudinary";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type VariationOption =
  | string
  | { value: string; price?: number; imageUrl?: string };

type VariationInput = {
  name: string;
  options?: VariationOption[];
};

// Helper function to process variations and upload images
async function processVariations(variations: VariationInput[]) {
  if (!Array.isArray(variations)) return [];

  return Promise.all(
    variations.map(async (variation) => ({
      ...variation,
      options: await Promise.all(
        (variation.options || []).map(async (option: VariationOption) => {
          if (typeof option === "string") return option;

          // If option has imageUrl that looks like base64, upload to Cloudinary
          if (option.imageUrl && option.imageUrl.startsWith("data:")) {
            try {
              const upload = await cloudinary.uploader.upload(option.imageUrl);
              return {
                ...option,
                imageUrl: upload.secure_url,
              };
            } catch (error) {
              console.error("Failed to upload variation image:", error);
              // Remove the failed imageUrl
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { imageUrl: _, ...optionWithoutImage } = option;
              return optionWithoutImage;
            }
          }

          return option;
        }),
      ),
    })),
  );
}

export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view");
  const isRecycleBin = view === "recycle-bin";
  const products = await prisma.product.findMany({
    where: isRecycleBin ? { isDeleted: true } : { isDeleted: false },
    orderBy: { id: "desc" },
  });
  return Response.json(products);
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    name,
    description,
    price,
    stock,
    category = "New Phones",
    brand = "",
    buyOneGetOneFree = false,
  } = body;
  const images: string[] = Array.isArray(body.images)
    ? body.images
    : body.image
      ? [body.image]
      : [];

  const rawVariations = Array.isArray(body.variations) ? body.variations : [];

  if (!images.length) {
    return Response.json(
      { message: "At least one image is required" },
      { status: 400 },
    );
  }

  const uploads = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    images.map((img: any) => cloudinary.uploader.upload(img)),
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const urls = uploads.map((u: any) => u.secure_url);

  // Process variations and upload any variation option images
  const processedVariations = await processVariations(rawVariations);

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price,
      stock,
      category,
      brand,
      buyOneGetOneFree,
      variations: processedVariations,
      imageUrl: urls[0],
      imageUrls: urls,
    },
  });

  return Response.json(product);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id } = body;

  if (!id) {
    return Response.json(
      { message: "Product id is required" },
      { status: 400 },
    );
  }

  const existing = await prisma.product.findFirst({
    where: { id, isDeleted: false },
  });
  if (!existing) {
    return Response.json({ message: "Not found" }, { status: 404 });
  }

  const images: string[] = Array.isArray(body.images)
    ? body.images
    : body.image
      ? [body.image]
      : [];

  const keepImageUrls: string[] | undefined = Array.isArray(body.keepImageUrls)
    ? body.keepImageUrls.filter(Boolean)
    : undefined;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const uploads = images.length
    ? await Promise.all(
        images.map((img: any) => cloudinary.uploader.upload(img)),
      )
    : [];

  const uploadedUrls = uploads.map((u: any) => u.secure_url);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const nextImageUrls = keepImageUrls ?? existing.imageUrls ?? [];
  const mergedImageUrls = [...nextImageUrls, ...uploadedUrls];

  if (!mergedImageUrls.length) {
    return Response.json(
      { message: "At least one image must remain" },
      { status: 400 },
    );
  }

  const imageUrl = mergedImageUrls[0];

  // Process variations and upload any variation option images
  let processedVariations = existing.variations;
  if (Array.isArray(body.variations)) {
    processedVariations = await processVariations(body.variations);
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      price: body.price ?? existing.price,
      stock: body.stock ?? existing.stock,
      category: body.category ?? existing.category,
      brand: body.brand ?? existing.brand,
      buyOneGetOneFree:
        body.buyOneGetOneFree !== undefined
          ? body.buyOneGetOneFree
          : existing.buyOneGetOneFree,
      variations: (processedVariations ?? []) as Prisma.InputJsonValue,
      imageUrl,
      imageUrls: mergedImageUrls,
    },
  });

  return Response.json(product);
}
