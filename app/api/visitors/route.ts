import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function GET(req: Request) {
  const user = await requireAdmin();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const take = Number(url.searchParams.get("take") || 200);

  const items = await prisma.visitor.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(take, 1000),
  });

  return Response.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const visitorKey = String(body.visitorKey || "").trim();
  if (!visitorKey) {
    return Response.json({ message: "Missing visitorKey" }, { status: 400 });
  }
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const realIp =
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("true-client-ip") ||
    req.headers.get("fastly-client-ip") ||
    req.headers.get("x-client-ip") ||
    forwarded.split(",")[0] ||
    "";
  const ip = String(body.ip || realIp).trim();
  const userAgent =
    (body.userAgent as string) || req.headers.get("user-agent") || "";
  const referrer =
    (body.referrer as string) || req.headers.get("referer") || "";
  const lang =
    (body.lang as string) || req.headers.get("accept-language") || "";
  const path = (body.path as string) || "";

  try {
    const now = new Date();
    const record = await prisma.visitor.upsert({
      where: { visitorKey },
      update: {
        ip,
        userAgent,
        referrer,
        lang,
        lastSeenAt: now,
      },
      create: {
        visitorKey,
        ip,
        path,
        userAgent,
        referrer,
        lang,
        firstSeenAt: now,
        lastSeenAt: now,
      },
    });
    return Response.json(record, { status: 201 });
  } catch (err) {
    console.error("Visitor log error", err);
    return Response.json({ message: "Error" }, { status: 500 });
  }
}
