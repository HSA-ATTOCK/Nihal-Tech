type CTA = { label: string; url: string };

export function buildEmail({
  title,
  greeting,
  intro,
  lines = [],
  cta,
  footer,
}: {
  title: string;
  greeting?: string;
  intro?: string;
  lines?: Array<string>;
  cta?: CTA;
  footer?: string;
}) {
  const safe = (value?: string) =>
    (value || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lineItems = lines
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="margin: 0 0 10px 0; color: #0f172a; font-size: 15px;">${line}</p>`,
    )
    .join("");

  const ctaBlock = cta
    ? `<div style="margin: 22px 0;"><a href="${cta.url}" style="display: inline-block; background: linear-gradient(135deg, #1f4b99, #163a79); color: #fff; padding: 12px 22px; border-radius: 999px; font-weight: 700; text-decoration: none;">${cta.label}</a></div>`
    : "";

  const footerBlock = footer
    ? `<p style="margin: 16px 0 0 0; color: #475569; font-size: 13px;">${footer}</p>`
    : "";

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);">
        <div style="background: linear-gradient(135deg, #1f4b99, #163a79); padding: 16px 20px; color: #fff;">
          <h1 style="margin: 0; font-size: 22px;">${safe(title)}</h1>
        </div>
        <div style="padding: 20px 20px 24px 20px;">
          ${greeting ? `<p style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px;">${greeting}</p>` : ""}
          ${intro ? `<p style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px;">${intro}</p>` : ""}
          ${lineItems}
          ${ctaBlock}
          ${footerBlock}
          <p style="margin: 18px 0 0 0; color: #94a3b8; font-size: 12px;">Nihal Tech · UK</p>
        </div>
      </div>
    </div>
  `;
}
