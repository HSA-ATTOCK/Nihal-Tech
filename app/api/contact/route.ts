export const runtime = "nodejs";

import { transporter } from "@/lib/mail";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { buildEmail } from "@/lib/mailTemplate";

const adminEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const { name, email, subject, message } = await req.json();

  const fromEmail = session?.user?.email || email;
  const displayName = name || session?.user?.name || "Customer";

  if (!fromEmail || !message || !subject) {
    return Response.json(
      { message: "Email, subject, and message are required" },
      { status: 400 },
    );
  }

  const adminHtml = buildEmail({
    title: "New contact message",
    intro: "A customer submitted a contact form.",
    lines: [
      `<strong>From:</strong> ${displayName} (${fromEmail})`,
      `<strong>Subject:</strong> ${subject}`,
      `<strong>Message:</strong> ${message.replace(/\n/g, "<br/>")}`,
    ],
  });

  const clientHtml = buildEmail({
    title: "We received your message",
    greeting: `Hi ${displayName},`,
    intro:
      "Thanks for contacting Nihal Tech. We will respond within one business day.",
    lines: [
      `<strong>Your subject:</strong> ${subject}`,
      `<strong>Your message:</strong> ${message.replace(/\n/g, "<br/>")}`,
    ],
    footer: "If this wasn't you, please reply to this email so we can help.",
  });

  try {
    if (adminEmail) {
      await transporter.sendMail({
        to: adminEmail,
        from: process.env.EMAIL_USER,
        subject: `[Contact] ${subject}`,
        html: adminHtml,
      });
    }

    await transporter.sendMail({
      to: fromEmail,
      from: process.env.EMAIL_USER,
      subject: "We received your message",
      html: clientHtml,
    });
  } catch (error) {
    console.error("Contact email error:", error);
    return Response.json(
      { message: "Could not send message. Please try again later." },
      { status: 500 },
    );
  }

  return Response.json({ message: "Message sent" });
}
