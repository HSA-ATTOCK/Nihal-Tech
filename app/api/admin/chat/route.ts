export const runtime = "nodejs";

import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/mail";
import { buildEmail } from "@/lib/mailTemplate";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!admin || admin.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const conversations = await prisma.chatConversation.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ conversations });
  } catch (error) {
    console.error("Admin chat GET error:", error);
    return Response.json(
      { error: "Failed to fetch conversations" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!admin || admin.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { conversationId, message } = await req.json();

    if (!conversationId || !message || !message.trim()) {
      return Response.json(
        { error: "Conversation ID and message are required" },
        { status: 400 },
      );
    }

    // Get conversation
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!conversation) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    // Create message
    const newMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: admin.id,
        message: message.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Update conversation
    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: message.trim(),
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 },
      },
    });

    // Send email notification to user
    const userEmail = conversation.user.email;
    if (userEmail) {
      const emailHtml = buildEmail({
        title: "New Support Message",
        greeting: `Hi ${conversation.user.name},`,
        intro: "You have received a new message from our support team.",
        lines: [
          `<strong>Message:</strong><br/>${message.replace(/\n/g, "<br/>")}`,
        ],
        footer:
          "Login to your account to continue the conversation in the chat widget.",
      });

      try {
        await transporter.sendMail({
          to: userEmail,
          from: process.env.EMAIL_USER,
          subject: "New message from Nihal Tech Support",
          html: emailHtml,
        });
      } catch (emailError) {
        console.error("Failed to send chat email to user:", emailError);
      }
    }

    return Response.json({ message: newMessage });
  } catch (error) {
    console.error("Admin chat POST error:", error);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}
