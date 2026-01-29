export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";

async function verifyToken(token: string) {
  if (!token) {
    return Response.json(
      { message: "Missing verification token" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  });

  if (!user) {
    return Response.json(
      { message: "Invalid or expired verification link" },
      { status: 400 },
    );
  }

  if (user.verified) {
    return Response.json({ message: "Email is already verified" });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { verified: true, verificationToken: null },
  });

  return Response.json({ message: "Email verified successfully" });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await params;
  return verifyToken(token);
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await params;
  return verifyToken(token);
}
