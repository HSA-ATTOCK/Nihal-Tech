import cloudinary from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({});
  return Response.json(products);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, description, price, stock, category = "New Phones" } = body;
  const images: string[] = Array.isArray(body.images)
    ? body.images
    : body.image
      ? [body.image]
      : [];

  const variations = Array.isArray(body.variations) ? body.variations : [];

  if (!images.length) {
    return Response.json(
      { message: "At least one image is required" },
      { status: 400 },
    );
  }

  const uploads = await Promise.all(
    images.map((img) => cloudinary.uploader.upload(img)),
  );
  const urls = uploads.map((u) => u.secure_url);

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price,
      stock,
      category,
      variations,
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

  const existing = await prisma.product.findUnique({ where: { id } });
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

  const uploads = images.length
    ? await Promise.all(images.map((img) => cloudinary.uploader.upload(img)))
    : [];

  const uploadedUrls = uploads.map((u) => u.secure_url);

  const nextImageUrls = keepImageUrls ?? existing.imageUrls ?? [];
  const mergedImageUrls = [...nextImageUrls, ...uploadedUrls];

  if (!mergedImageUrls.length) {
    return Response.json(
      { message: "At least one image must remain" },
      { status: 400 },
    );
  }

  const imageUrl = mergedImageUrls[0];

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      price: body.price ?? existing.price,
      stock: body.stock ?? existing.stock,
      category: body.category ?? existing.category,
      variations: Array.isArray(body.variations)
        ? body.variations
        : existing.variations,
      imageUrl,
      imageUrls: mergedImageUrls,
    },
  });

  return Response.json(product);
}
