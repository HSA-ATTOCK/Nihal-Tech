import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

async function requireEmail() {
  const session = await getServerSession(authOptions);
  return session?.user?.email || null;
}

export async function GET() {
  const email = await requireEmail();
  if (!email) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { name: true, email: true, phone: true, address: true },
  });

  if (!user) {
    return Response.json({ message: "User not found" }, { status: 404 });
  }

  return Response.json(user);
}

export async function PUT(req: Request) {
  const email = await requireEmail();
  if (!email) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { name, phone, address } = await req
    .json()
    .catch(() => ({ name: "", phone: "", address: "" }));
  if (!name || typeof name !== "string") {
    return Response.json({ message: "Name is required" }, { status: 400 });
  }

  await prisma.user.update({
    where: { email },
    data: { name, phone: phone || "", address: address || "" },
  });

  return Response.json({
    message: "Profile updated",
    name,
    email,
    phone: phone || "",
    address: address || "",
  });
}
