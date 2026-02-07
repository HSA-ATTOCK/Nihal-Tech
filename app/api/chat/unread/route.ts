export const runtime = "nodejs";

import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ unreadCount: 0 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ unreadCount: 0 });
    }

    const conversation = await prisma.chatConversation.findFirst({
      where: { userId: user.id },
      select: { unreadCount: true },
    });

    return Response.json({
      unreadCount: conversation?.unreadCount || 0,
    });
  } catch (error) {
    console.error("Unread count error:", error);
    return Response.json({ unreadCount: 0 });
  }
}
