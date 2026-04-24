export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { transporter } from "@/lib/mail";
import { buildEmail } from "@/lib/mailTemplate";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));

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

  if (user.verified) {
    return Response.json({ message: "Your email is already verified" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { email },
    data: { verificationToken: token },
  });

  const baseUrl =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") || new URL(req.url).origin;
  const verificationUrl = new URL(`/verify/${token}`, baseUrl).toString();

  try {
    await transporter.sendMail({
      to: email,
      subject: "Verify your Nihal Tech account",
      html: buildEmail({
        title: "Verify your email",
        greeting: `Hi ${user.name || "there"},`,
        intro: "Thanks for registering with Nihal Tech.",
        lines: [
          "Please verify your email to activate your account.",
          `If the button doesn't work, copy this link: ${verificationUrl}`,
        ],
        cta: { label: "Verify email", url: verificationUrl },
        footer:
          "If you did not create this account, you can ignore this email.",
      }),
    });
  } catch (emailError) {
    console.error("Resend verification email failed:", emailError);
    return Response.json(
      {
        message:
          "Verification email could not be sent. Please try again later.",
      },
      { status: 500 },
    );
  }

  return Response.json({ message: "Verification email sent again" });
}
