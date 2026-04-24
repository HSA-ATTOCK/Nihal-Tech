import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));

  if (!email || typeof email !== "string") {
    return Response.json({ message: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { verified: true },
  });

  if (!user) {
    return Response.json({ verified: true, exists: false });
  }

  return Response.json({ verified: user.verified, exists: true });
}
