import Link from "next/link";
import Container from "./Container";

const quickLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Repairs", href: "/repair-booking" },
  { label: "Bookings", href: "/bookings" },
  { label: "Orders", href: "/orders" },
  { label: "Cart", href: "/cart" },
  { label: "Profile", href: "/profile" },
];

const supportLinks = [
  { label: "Contact", href: "/contact" },
  { label: "FAQs", href: "/faqs" },
];

const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white/90 backdrop-blur">
      <Container>
        <div className="py-8 sm:py-12 grid gap-8 sm:gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr] text-center lg:text-left">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.15em]">
              Nihal Tech
            </p>
            <p className="text-lg font-semibold text-slate-900">
              Trusted devices, repairs, and support for modern teams.
            </p>
            <div className="space-y-2 text-sm text-slate-700">
              <p>Phone: +44 20 7123 4567</p>
              <p>WhatsApp: +44 7700 900123</p>
              <p>Email: support@nihaltech.com</p>
              <p>Address: 221B Tech Street, London</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.15em]">
              Quick links
            </p>
            <ul className="space-y-2 text-[#1f4b99]">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    className="text-[#1f4b99] hover:text-[#163a79] transition-colors"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.15em]">
              Support
            </p>
            <ul className="space-y-2 text-[#1f4b99]">
              {supportLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    className="text-[#1f4b99] hover:text-[#163a79] transition-colors"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.15em]">
              Legal
            </p>
            <ul className="space-y-2 text-[#1f4b99]">
              {legalLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    className="text-[#1f4b99] hover:text-[#163a79] transition-colors"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pb-8 sm:pb-10 text-sm text-slate-500 text-center">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p>© {new Date().getFullYear()} Nihal Tech. All rights reserved.</p>
            <p>Response hours: Mon-Fri, 9:00–17:00 UK time</p>
          </div>
          <div className="border-t border-slate-200 pt-3">
            <p>
              Developed by{" "}
              <a
                href="https://webautosolutions.co.uk"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#1f4b99" }}
              >
                WebAuto Solutions
              </a>
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
