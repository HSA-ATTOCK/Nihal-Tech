export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { transporter } from "@/lib/mail";
import { buildEmail } from "@/lib/mailTemplate";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return Response.json(
        { message: "Email already registered" },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString("hex");

    await prisma.user.create({
      data: { name, email, password: hashed, verificationToken: token },
    });

    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify/${token}`;

    try {
      await transporter.sendMail({
        to: email,
        subject: "Verify your Nihal Tech account",
        html: buildEmail({
          title: "Verify your email",
          greeting: `Hi ${name || "there"},`,
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
      console.error("Email sending failed:", emailError);
      // User is still created, just email failed
      return Response.json({
        message:
          "Account created but verification email could not be sent. Please contact support.",
        verificationToken: token, // Include token for manual verification if needed
      });
    }

    return Response.json({ message: "Check email for verification" });
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json(
      { message: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
