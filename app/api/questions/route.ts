import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { transporter } from "@/lib/mail";
import { buildEmail } from "@/lib/mailTemplate";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId)
    return Response.json({ message: "productId is required" }, { status: 400 });

  const questions = await prisma.productQuestion.findMany({
    where: { productId },
    include: {
      user: true,
      answers: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(
    questions.map((q) => ({
      id: q.id,
      question: q.question,
      createdAt: q.createdAt,
      user: q.user ? { name: q.user.name, email: q.user.email } : null,
      answers: q.answers.map((a) => ({
        id: a.id,
        body: a.body,
        createdAt: a.createdAt,
        user: a.user ? { name: a.user.name, email: a.user.email } : null,
      })),
    })),
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { productId, question } = body as {
    productId?: string;
    question?: string;
  };
  if (!productId || !question)
    return Response.json({ message: "Missing fields" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product)
    return Response.json({ message: "Product not found" }, { status: 404 });

  const created = await prisma.productQuestion.create({
    data: { productId, userId: user.id, question },
    include: { user: true, answers: true },
  });

  const adminEmail = process.env.EMAIL_USER;
  const subject = `New product question: ${product.name}`;
  const adminHtml = buildEmail({
    title: "New product question",
    intro: "A customer submitted a question.",
    lines: [
      `<strong>Product:</strong> ${product.name}`,
      `<strong>Question:</strong> ${question}`,
      user.email ? `<strong>Customer:</strong> ${user.email}` : "",
    ],
  });

  if (adminEmail) {
    transporter
      .sendMail({
        to: adminEmail,
        from: process.env.EMAIL_USER,
        subject,
        html: adminHtml,
      })
      .catch((err) => console.error("Question admin email failed", err));
  }

  return Response.json({
    id: created.id,
    question: created.question,
    createdAt: created.createdAt,
    user: created.user
      ? { name: created.user.name, email: created.user.email }
      : null,
    answers: [],
  });
}
