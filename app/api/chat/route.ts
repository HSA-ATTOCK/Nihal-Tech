export const runtime = "nodejs";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/mail";
import { buildEmail } from "@/lib/mailTemplate";

const adminEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Get or create conversation
    let conversation = await prisma.chatConversation.findFirst({
      where: { userId: user.id },
    });

    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: { userId: user.id },
      });
    }

    // Fetch messages
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark messages as read
    await prisma.chatMessage.updateMany({
      where: {
        conversationId: conversation.id,
        senderId: { not: user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    // Update unread count
    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { unreadCount: 0 },
    });

    return Response.json({ messages });
  } catch (error) {
    console.error("Chat GET error:", error);
    return Response.json(
      { error: "Failed to fetch messages" },
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const { message } = await req.json();

    if (!message || !message.trim()) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    // Get or create conversation
    let conversation = await prisma.chatConversation.findFirst({
      where: { userId: user.id },
    });

    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: { userId: user.id },
      });
    }

    // Create message
    const newMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        message: message.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
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
      },
    });

    // Send email notification to admin
    if (adminEmail) {
      const emailHtml = buildEmail({
        title: "New Chat Message",
        intro: "You have received a new chat message from a user.",
        lines: [
          `<strong>From:</strong> ${user.name} (${user.email})`,
          `<strong>Message:</strong><br/>${message.replace(/\n/g, "<br/>")}`,
        ],
        footer: "Reply to this message from the Admin Chat Dashboard.",
      });

      try {
        await transporter.sendMail({
          to: adminEmail,
          subject: `[Chat] New message from ${user.name}`,
          html: emailHtml,
          replyTo: user.email,
        });
      } catch (emailError) {
        console.error("Failed to send chat email notification:", emailError);
      }
    }

    return Response.json({ message: newMessage });
  } catch (error) {
    console.error("Chat POST error:", error);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}
