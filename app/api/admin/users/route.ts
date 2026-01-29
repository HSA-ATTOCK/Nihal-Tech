import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "../../auth/[...nextauth]/route";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { role?: string } | undefined;
  const isAdmin = sessionUser?.role === "ADMIN";

  if (!session?.user?.email || !isAdmin) {
    return null;
  }

  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session)
    return Response.json({ message: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, verified: true },
    orderBy: { email: "asc" },
  });

  return Response.json(users);
}

export async function PUT(req: Request) {
  const session = await requireAdmin();
  if (!session)
    return Response.json({ message: "Unauthorized" }, { status: 401 });

  const { userId, password } = await req.json();

  if (!userId || !password) {
    return Response.json(
      { message: "userId and password are required" },
      { status: 400 },
    );
  }

  if (typeof password !== "string" || password.length < 6) {
    return Response.json(
      { message: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
    select: { id: true, email: true },
  });

  return Response.json(updated);
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session)
    return Response.json({ message: "Unauthorized" }, { status: 401 });

  const { userId, verified } = await req.json();

  if (!userId || typeof verified !== "boolean") {
    return Response.json(
      { message: "userId and verified are required" },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { verified },
    select: { id: true, email: true, verified: true, role: true, name: true },
  });

  return Response.json(updated);
}

export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session)
    return Response.json({ message: "Unauthorized" }, { status: 401 });

  const { userId } = await req.json();

  if (!userId) {
    return Response.json({ message: "userId is required" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: userId } });

  return Response.json({ id: userId });
}
