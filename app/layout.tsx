import "./globals.css";
import Navbar from "@/components/Navbar";
import FlashSaleStrip from "@/components/FlashSaleStrip";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import Providers from "./providers";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Nihal Tech",
  description: "Trusted devices, repairs, and support for modern teams.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="text-slate-900">
        <Providers>
          <Navbar />
          <FlashSaleStrip />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
