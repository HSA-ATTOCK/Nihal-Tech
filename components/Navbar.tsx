"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-slate-700 hover:text-slate-900 transition-colors relative group"
    >
      {label}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1f4b99] group-hover:w-full transition-all duration-300"></span>
    </Link>
  );
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const userInitial = session?.user?.name?.[0]?.toUpperCase() || "";
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/repairs", label: "Repairs" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/users", label: "Users" },
  ];

  const clientLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/repair-booking", label: "Repair" },
    { href: "/cart", label: "Cart" },
  ];

  const linksToRender = isAdminRoute ? adminLinks : clientLinks;
  const dropdownLinks = isAdminRoute
    ? adminLinks
    : [
        { href: "/bookings", label: "Bookings" },
        { href: "/orders", label: "Orders" },
        { href: "/wishlist", label: "Wishlist" },
        { href: "/profile", label: "Profile" },
      ];

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <Link href={isAdminRoute ? "/admin" : "/"}>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 hover:text-[#1f4b99] transition-colors">
            Nihal Tech
          </h1>
        </Link>

        <div className="flex items-center space-x-8 text-sm font-medium">
          {linksToRender.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}

          {status === "loading" && (
            <span className="text-xs text-slate-500">Loading...</span>
          )}

          {status === "unauthenticated" && (
            <>
              <NavLink href="/login" label="Login" />
              <Link
                href="/signup"
                className="bg-[#1f4b99] text-white visited:text-white hover:text-white focus-visible:text-white active:text-white px-4 py-2 rounded-full hover:bg-[#163a79] transition-colors shadow-sm font-semibold"
                style={{ color: "white" }}
              >
                Sign Up
              </Link>
            </>
          )}

          {status === "authenticated" && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-10 h-10 rounded-full bg-[#1f4b99] flex items-center justify-center text-white font-bold shadow-sm border border-[#1f4b99]/10 cursor-pointer hover:bg-[#163a79] focus:outline-none focus:ring-2 focus:ring-[#1f4b99]/30"
                aria-haspopup="menu"
                aria-expanded={open}
              >
                {userInitial || "U"}
              </button>

              {open && (
                <div className="absolute right-0 mt-3 w-56 rounded-xl bg-white border border-slate-200 shadow-lg">
                  <div className="px-4 py-3 border-b border-slate-200">
                    <p className="text-xs text-slate-500">Signed in as</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {session.user?.name || session.user?.email}
                    </p>
                  </div>
                  <div className="py-2">
                    {isAdminRoute ? (
                      <Link
                        href="/admin/questions"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setOpen(false)}
                      >
                        Questions
                      </Link>
                    ) : (
                      dropdownLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => setOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
