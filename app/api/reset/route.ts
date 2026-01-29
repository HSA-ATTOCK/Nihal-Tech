import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function isStrongPassword(password: string) {
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasLength && hasUpper && hasSpecial;
}

export async function POST(req: Request) {
  const { token, password } = await req.json();

  if (!token || typeof token !== "string") {
    return Response.json({ message: "Token is required" }, { status: 400 });
  }

  if (!password || typeof password !== "string") {
    return Response.json({ message: "Password is required" }, { status: 400 });
  }

  if (!isStrongPassword(password)) {
    return Response.json(
      {
        message:
          "Password must be at least 8 characters, include one uppercase letter, and one special character",
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findFirst({ where: { resetToken: token } });

  if (!user) {
    return Response.json(
      { message: "Invalid or expired reset link" },
      { status: 400 },
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetToken: null },
  });

  return Response.json({ message: "Password updated" });
}
