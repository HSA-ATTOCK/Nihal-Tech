import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function DELETE(
  _req: NextRequest,
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

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return Response.json({ message: "Not found" }, { status: 404 });

  const canDelete = review.userId === user.id || user.role === "ADMIN";
  if (!canDelete)
    return Response.json({ message: "Forbidden" }, { status: 403 });

  await prisma.review.delete({ where: { id } });
  return Response.json({ success: true });
}
