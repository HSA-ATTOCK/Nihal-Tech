import { transporter } from "@/lib/mail";
import { NextRequest } from "next/server";

function getErrorText(error: unknown) {
  if (error instanceof Error)
    return `${error.name}: ${error.message}\n${error.stack || ""}`;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

const contactEmail =
  process.env.EMAIL_USER || process.env.SUPPORT_EMAIL || "support@example.com";
const contactPhone =
  process.env.CONTACT_PHONE || process.env.SUPPORT_PHONE || "";

export async function reportServerError(
  req: NextRequest | null,
  error: unknown,
) {
  const to = process.env.EMAIL_USER;
  const url = req?.url || "(unknown url)";
  console.error("Server error at", url, error);
  if (!to) return;

  const subject = `Server error on ${url}`;
  const text = `A 500 error occurred.\nURL: ${url}\n\n${getErrorText(error)}`;

  try {
    await transporter.sendMail({
      to,
      from: process.env.EMAIL_USER,
      subject,
      text,
    });
  } catch (mailError) {
    console.error("Failed to send error email", mailError);
  }
}

type RouteHandler<Params = unknown> = (
  req: NextRequest,
  ctx: { params: Params },
) => Promise<Response> | Response;

// Wraps a route handler to send an email when an unhandled error occurs and returns contact info to the client.
export function withErrorEmail<Params = unknown>(
  handler: RouteHandler<Params>,
) {
  return async (req: NextRequest, ctx: { params: Params }) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      await reportServerError(req, error);
      return Response.json(
        {
          message: "Internal server error",
          contactEmail,
          contactPhone,
        },
        { status: 500 },
      );
    }
  };
}

export const ERROR_CONTACT_EMAIL = contactEmail;
export const ERROR_CONTACT_PHONE = contactPhone;
