"use client";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const VISITOR_COOKIE = "nihal_visitor_id";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, days = 3650) {
  const expires = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000,
  ).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

function getOrCreateVisitorKey() {
  const existing = readCookie(VISITOR_COOKIE);
  if (existing) return existing;

  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  writeCookie(VISITOR_COOKIE, created);
  return created;
}

export default function VisitorTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastLoggedPath = useRef<string | null>(null);

  async function getPublicIp() {
    try {
      const cached = localStorage.getItem("nihal_public_ip");
      if (cached) return cached;

      const response = await fetch("https://api.ipify.org?format=json", {
        cache: "no-store",
      });
      if (!response.ok) return "";

      const data = (await response.json()) as { ip?: string };
      const ip = String(data.ip || "").trim();
      if (ip) localStorage.setItem("nihal_public_ip", ip);
      return ip;
    } catch {
      return "";
    }
  }

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return;

    const query = searchParams.toString();
    const currentPath = query ? `${pathname}?${query}` : pathname;
    if (lastLoggedPath.current === currentPath) return;
    lastLoggedPath.current = currentPath;

    const visitorKey = getOrCreateVisitorKey();
    if (readCookie(`${VISITOR_COOKIE}_logged`) === "1") return;

    try {
      getPublicIp().then((ip) => {
        const payload = {
          visitorKey,
          path: currentPath,
          ip: ip || null,
          referrer: document.referrer || null,
          lang: navigator.language || null,
          userAgent: navigator.userAgent || null,
        };

        // fire-and-forget
        fetch("/api/visitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => {});

        writeCookie(`${VISITOR_COOKIE}_logged`, "1", 30);
      });
    } catch {
      // ignore
    }
  }, [pathname, searchParams]);

  return null;
}
