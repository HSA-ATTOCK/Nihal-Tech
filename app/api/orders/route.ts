import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

type SessionUser = { id?: string; email?: string | null };

// GET /api/orders - list the current user's orders (newest first).
// Added for the mobile app: the web client reads this data via a server
// component (app/orders/page.tsx) instead of a REST call, but a native
// client needs an actual endpoint. Mirrors that page's Prisma query.
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as SessionUser | undefined)?.id;

  if (!session?.user?.email || !userId) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(orders);
}
