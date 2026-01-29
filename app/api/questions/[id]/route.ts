import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { transporter } from "@/lib/mail";
import { buildEmail } from "@/lib/mailTemplate";

async function loadQuestion(id: string) {
  return prisma.productQuestion.findUnique({
    where: { id },
    include: {
      user: true,
      product: true,
      answers: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const question = await loadQuestion(id);
  if (!question)
    return Response.json({ message: "Not found" }, { status: 404 });

  return Response.json({
    id: question.id,
    question: question.question,
    createdAt: question.createdAt,
    product: question.product
      ? { id: question.product.id, name: question.product.name }
      : null,
    user: question.user
      ? { name: question.user.name, email: question.user.email }
      : null,
    answers: question.answers.map((a) => ({
      id: a.id,
      body: a.body,
      createdAt: a.createdAt,
      user: a.user ? { name: a.user.name, email: a.user.email } : null,
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return Response.json({ message: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN")
    return Response.json({ message: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { answer } = body as { answer?: string };
  if (!answer)
    return Response.json({ message: "Missing answer" }, { status: 400 });

  const question = await prisma.productQuestion.findUnique({ where: { id } });
  if (!question)
    return Response.json({ message: "Not found" }, { status: 404 });

  await prisma.productAnswer.create({
    data: { questionId: id, userId: user.id, body: answer },
  });
  const full = await loadQuestion(id);

  const customerEmail = full?.user?.email;
  const subject = full?.product
    ? `Answer to your question: ${full.product.name}`
    : "Your product question was answered";
  if (customerEmail && full) {
    const html = buildEmail({
      title: "We answered your question",
      intro: "Thanks for reaching out. Here's our reply.",
      lines: [
        full.product ? `<strong>Product:</strong> ${full.product.name}` : "",
        `<strong>Question:</strong> ${full.question}`,
        `<strong>Answer:</strong> ${answer}`,
      ],
    });

    transporter
      .sendMail({
        to: customerEmail,
        from: process.env.EMAIL_USER,
        subject,
        html,
      })
      .catch((err) => console.error("Question answer email failed", err));
  }

  return Response.json({
    id: full?.id,
    question: full?.question,
    createdAt: full?.createdAt,
    product: full?.product
      ? { id: full.product.id, name: full.product.name }
      : null,
    user: full?.user ? { name: full.user.name, email: full.user.email } : null,
    answers:
      full?.answers.map((a) => ({
        id: a.id,
        body: a.body,
        createdAt: a.createdAt,
        user: a.user ? { name: a.user.name, email: a.user.email } : null,
      })) || [],
  });
}
