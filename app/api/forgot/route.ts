import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { transporter } from "@/lib/mail";
import { buildEmail } from "@/lib/mailTemplate";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return Response.json({ message: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return Response.json(
      { message: "No account found for this email" },
      { status: 404 },
    );
  }

  if (!user.verified) {
    return Response.json(
      { message: "Please verify your email before resetting password" },
      { status: 400 },
    );
  }

  const token = crypto.randomBytes(32).toString("hex");

  await prisma.user.update({
    where: { email },
    data: { resetToken: token },
  });

  const baseUrl =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") || new URL(req.url).origin;
  const resetUrl = new URL(`/reset/${token}`, baseUrl).toString();

  try {
    await transporter.sendMail({
      to: email,
      subject: "Reset your password",
      html: buildEmail({
        title: "Reset your password",
        greeting: "Hi there,",
        intro: "We received a request to reset your password.",
        lines: [
          `Click the button below to set a new password. If that doesn't work, copy this link: ${resetUrl}`,
        ],
        cta: { label: "Reset password", url: resetUrl },
        footer: "If you didn't request this, you can safely ignore this email.",
      }),
    });
  } catch (emailError) {
    console.error("Reset email failed:", emailError);
    return Response.json(
      { message: "Could not send reset email. Please try again later." },
      { status: 500 },
    );
  }

  return Response.json({ message: "Reset email sent" });
}
