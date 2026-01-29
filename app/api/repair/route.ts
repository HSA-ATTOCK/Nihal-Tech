import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { transporter } from "@/lib/mail";
import { buildEmail } from "@/lib/mailTemplate";

type SessionUser = {
  id?: string;
  email?: string | null;
  role?: string;
  name?: string | null;
};

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return session;
}

const adminEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;

function isWithinBusinessHours(date: Date) {
  const hour = date.getHours();
  return hour >= 9 && hour <= 17;
}

export async function GET() {
  const session = await requireSession();
  if (!session)
    return Response.json({ message: "Unauthorized" }, { status: 401 });

  const sessionUser = session.user as SessionUser;
  const userId = sessionUser.id || "";
  const isAdmin = sessionUser.role === "ADMIN";

  const bookings = await prisma.repairBooking.findMany({
    where: isAdmin ? undefined : { userId },
    include: isAdmin ? { user: true } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return Response.json(bookings);
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session)
    return Response.json({ message: "Unauthorized" }, { status: 401 });

  const { phoneModel, issue, date } = await req.json();

  if (!phoneModel || !issue || !date) {
    return Response.json(
      { message: "All fields are required" },
      { status: 400 },
    );
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return Response.json({ message: "Invalid date" }, { status: 400 });
  }

  if (!isWithinBusinessHours(parsedDate)) {
    return Response.json(
      { message: "Appointments must be between 9:00 and 17:00" },
      { status: 400 },
    );
  }

  const userId = (session.user as SessionUser).id || "";

  const booking = await prisma.repairBooking.create({
    data: { userId, phoneModel, issue, date: parsedDate },
  });

  const userEmail = session.user?.email;
  const displayName = session.user?.name || "Customer";
  const when = parsedDate.toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
  });

  try {
    if (adminEmail) {
      await transporter.sendMail({
        to: adminEmail,
        from: process.env.EMAIL_USER,
        subject: `[Repair] ${phoneModel}`,
        html: buildEmail({
          title: "New repair booking",
          intro: "A customer scheduled a repair appointment.",
          lines: [
            `<strong>Customer:</strong> ${displayName} (${userEmail})`,
            `<strong>Device:</strong> ${phoneModel}`,
            `<strong>Issue:</strong> ${issue.replace(/\n/g, "<br/>")}`,
            `<strong>Appointment:</strong> ${when}`,
          ],
        }),
      });
    }

    if (userEmail) {
      await transporter.sendMail({
        to: userEmail,
        from: process.env.EMAIL_USER,
        subject: "Your repair booking is confirmed",
        html: buildEmail({
          title: "Repair booking confirmed",
          greeting: `Hi ${displayName},`,
          intro: "We have scheduled your repair appointment.",
          lines: [
            `<strong>Device:</strong> ${phoneModel}`,
            `<strong>Issue:</strong> ${issue.replace(/\n/g, "<br/>")}`,
            `<strong>Appointment:</strong> ${when}`,
          ],
        }),
      });
    }
  } catch (error) {
    console.error("Booking email error:", error);
  }

  return Response.json(booking, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await requireSession();
  if (!session)
    return Response.json({ message: "Unauthorized" }, { status: 401 });

  const { id, phoneModel, issue, date, status } = await req.json();
  if (!id)
    return Response.json(
      { message: "Booking id is required" },
      { status: 400 },
    );

  const sessionUser = session.user as SessionUser;
  const userId = sessionUser.id || "";
  const isAdmin = sessionUser.role === "ADMIN";

  const existing = await prisma.repairBooking.findUnique({ where: { id } });
  if (!existing || (!isAdmin && existing.userId !== userId)) {
    return Response.json({ message: "Not found" }, { status: 404 });
  }

  let nextDate: Date | undefined;
  if (date) {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return Response.json({ message: "Invalid date" }, { status: 400 });
    }
    if (!isWithinBusinessHours(parsed)) {
      return Response.json(
        { message: "Appointments must be between 9:00 and 17:00" },
        { status: 400 },
      );
    }
    nextDate = parsed;
  }

  const booking = await prisma.repairBooking.update({
    where: { id },
    data: {
      phoneModel: phoneModel ?? existing.phoneModel,
      issue: issue ?? existing.issue,
      date: nextDate ?? existing.date,
      status: status ?? existing.status,
    },
  });

  return Response.json(booking);
}

export async function DELETE(req: Request) {
  const session = await requireSession();
  if (!session)
    return Response.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id)
    return Response.json(
      { message: "Booking id is required" },
      { status: 400 },
    );

  const sessionUser = session.user as SessionUser;
  const userId = sessionUser.id || "";
  const isAdmin = sessionUser.role === "ADMIN";
  const existing = await prisma.repairBooking.findUnique({ where: { id } });
  if (!existing || (!isAdmin && existing.userId !== userId)) {
    return Response.json({ message: "Not found" }, { status: 404 });
  }

  await prisma.repairBooking.delete({ where: { id } });
  const userEmail = sessionUser.email;
  const displayName = sessionUser.name || "Customer";
  const when = existing?.date
    ? existing.date.toLocaleString("en-GB", {
        dateStyle: "full",
        timeStyle: "short",
      })
    : "";

  try {
    if (adminEmail) {
      await transporter.sendMail({
        to: adminEmail,
        from: process.env.EMAIL_USER,
        subject: `[Repair] Booking canceled ${existing?.phoneModel || id}`,
        html: buildEmail({
          title: "Repair booking canceled",
          intro: "A repair booking was canceled.",
          lines: [
            `<strong>Customer:</strong> ${displayName} (${userEmail})`,
            `<strong>Device:</strong> ${existing?.phoneModel || "Unknown"}`,
            `<strong>Appointment:</strong> ${when}`,
          ],
        }),
      });
    }

    if (userEmail) {
      await transporter.sendMail({
        to: userEmail,
        from: process.env.EMAIL_USER,
        subject: "Your repair booking was canceled",
        html: buildEmail({
          title: "Booking canceled",
          greeting: `Hi ${displayName},`,
          intro: "Your repair booking has been canceled.",
          lines: [
            `<strong>Device:</strong> ${existing?.phoneModel || "Unknown"}`,
            `<strong>Original appointment:</strong> ${when}`,
          ],
          footer: "If this was a mistake, please book again from your account.",
        }),
      });
    }
  } catch (error) {
    console.error("Cancel email error:", error);
  }
  return Response.json({ message: "Deleted" });
}
