import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function GET() {
  const user = await requireUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const methods = await prisma.paymentMethod.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return Response.json(methods);
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    nameOnCard,
    brand,
    last4,
    cardNumber,
    cvv,
    expMonth,
    expYear,
    provider,
    providerPaymentMethodId,
    providerCustomerId,
    isDefault,
  } = body as {
    nameOnCard?: string;
    brand?: string;
    last4?: string;
    cardNumber?: string;
    cvv?: string;
    expMonth?: number;
    expYear?: number;
    provider?: string;
    providerPaymentMethodId?: string;
    providerCustomerId?: string;
    isDefault?: boolean;
  };

  if (!cardNumber) {
    return Response.json({ message: "Card number required" }, { status: 400 });
  }

  const sanitizedCard = cardNumber.replace(/\s+/g, "");
  const derivedLast4 = last4 || sanitizedCard.slice(-4);
  const cardBrand = brand || "Card";

  const count = await prisma.paymentMethod.count({
    where: { userId: user.id },
  });
  const shouldDefault = Boolean(isDefault || count === 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const created = await prisma.$transaction(async (tx: any) => {
    if (shouldDefault) {
      await tx.paymentMethod.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.paymentMethod.create({
      data: {
        userId: user.id,
        nameOnCard: nameOnCard || null,
        brand: cardBrand,
        last4: derivedLast4,
        cardNumber: sanitizedCard,
        cvv: cvv || null,
        expMonth: typeof expMonth === "number" ? expMonth : null,
        expYear: typeof expYear === "number" ? expYear : null,
        provider,
        providerPaymentMethodId,
        providerCustomerId,
        isDefault: shouldDefault,
      },
    });
  });

  return Response.json(created, { status: 201 });
}
