export const runtime = "nodejs";

import { transporter } from "@/lib/mail";
import { buildEmail } from "@/lib/mailTemplate";

const adminEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;

export async function POST(req: Request) {
  try {
    const { name, email, phone, company, solution, message } = await req.json();

    // Validation
    if (!name || !email || !solution || !message) {
      return Response.json(
        { error: "Name, email, solution, and message are required" },
        { status: 400 },
      );
    }

    // Build admin email
    const adminHtml = buildEmail({
      title: "New Digital Solution Inquiry",
      intro: "A new inquiry for digital solutions has been submitted.",
      lines: [
        `<strong>Name:</strong> ${name}`,
        `<strong>Email:</strong> ${email}`,
        `<strong>Phone:</strong> ${phone || "Not provided"}`,
        `<strong>Company:</strong> ${company || "Not provided"}`,
        `<strong>Solution:</strong> ${solution}`,
        `<strong>Message:</strong><br/>${message.replace(/\n/g, "<br/>")}`,
      ],
    });

    // Build client confirmation email
    const clientHtml = buildEmail({
      title: "Thank you for your inquiry",
      greeting: `Hi ${name},`,
      intro:
        "Thank you for your interest in our digital solutions. We have received your inquiry and will get back to you within 24 hours.",
      lines: [
        `<strong>Solution:</strong> ${solution}`,
        `<strong>Your message:</strong><br/>${message.replace(/\n/g, "<br/>")}`,
      ],
      footer:
        "If you have any urgent questions, please contact us at +44 7473 516168 or info@nihaltech.co.uk",
    });

    // Send email to admin
    if (adminEmail) {
      await transporter.sendMail({
        to: adminEmail,
        subject: `[Digital Solutions] ${solution} Inquiry from ${name}`,
        html: adminHtml,
        replyTo: email,
      });
    }

    // Send confirmation email to client
    await transporter.sendMail({
      to: email,
      subject: "Thank you for your digital solution inquiry - Nihal Tech",
      html: clientHtml,
    });

    return Response.json(
      { message: "Inquiry sent successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Solutions inquiry error:", error);
    return Response.json(
      { error: "Failed to send inquiry. Please try again later." },
      { status: 500 },
    );
  }
}
