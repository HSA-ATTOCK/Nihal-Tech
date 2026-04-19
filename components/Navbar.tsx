"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className="text-slate-700 hover:text-slate-900 transition-colors relative group"
    >
      {label}
      <span
        className={`absolute -bottom-1 left-0 h-0.5 bg-[#1f4b99] transition-all duration-300 ${isActive ? "w-full" : "w-0 group-hover:w-full"}`}
      ></span>
    </Link>
  );
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const userInitial = session?.user?.name?.[0]?.toUpperCase() || "";
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // separate refs for desktop and mobile account wrappers to avoid conflicts
  const accountDesktopRef = useRef<HTMLDivElement | null>(null);
  const accountMobileRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement | null>(null);

  // Scroll to top button visibility
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const loadCartCount = async () => {
      if (status !== "authenticated" || isAdminRoute) {
        setCartCount(0);
        return;
      }

      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        if (!res.ok) {
          setCartCount(0);
          return;
        }
        const items = (await res.json()) as Array<{ quantity?: number }>;
        const count = Array.isArray(items)
          ? items.reduce(
              (sum, item) => sum + Math.max(item.quantity || 0, 0),
              0,
            )
          : 0;
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };

    loadCartCount();

    // Keep badge fresh after add/remove cart actions in other pages.
    const onFocus = () => loadCartCount();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [status, isAdminRoute, pathname]);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 100);
    };

    // Check chat state
    const checkChatState = () => {
      if (typeof window !== "undefined") {
        const chatOpen =
          document.body.getAttribute("data-chat-open") === "true";
        setIsChatOpen(chatOpen);
      }
    };

    // attach listeners
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", onScroll, { passive: true });
      // Check chat state periodically
      const interval = setInterval(checkChatState, 100);
      // initialize
      onScroll();
      checkChatState();

      return () => {
        window.removeEventListener("scroll", onScroll);
        clearInterval(interval);
      };
    }
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;

      // Close account dropdown if clicked outside account area (check both desktop and mobile wrappers)
      const clickedInsideAccount =
        (accountDesktopRef.current &&
          accountDesktopRef.current.contains(target)) ||
        (accountMobileRef.current && accountMobileRef.current.contains(target));

      if (open && !clickedInsideAccount) {
        setOpen(false);
      }

      // Close mobile menu if it's open and clicked outside both the menu and hamburger button
      if (mobileMenuOpen) {
        if (mobileMenuRef.current) {
          const clickedInsideMenu = mobileMenuRef.current.contains(target);
          const clickedHamburger = hamburgerButtonRef.current?.contains(target);
          if (!clickedInsideMenu && !clickedHamburger) setMobileMenuOpen(false);
        }
      }
    };

    // Use 'click' so the button's onClick runs first and toggle state is applied predictably
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [mobileMenuOpen, open]);

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
    { href: "/solutions", label: "Solutions" },
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
    <>
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <Link href={isAdminRoute ? "/admin" : "/"}>
            <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="relative h-8 sm:h-10 w-8 sm:w-10">
                <Image
                  src="/logo.jpeg"
                  alt="Nihal Tech"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover rounded-full"
                  priority
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Nihal Tech
              </h1>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
            {linksToRender.map((link) => {
              const isCart = !isAdminRoute && link.href === "/cart";
              return (
                <div key={link.href} className="relative">
                  <NavLink href={link.href} label={link.label} />
                  {isCart && cartCount > 0 && (
                    <span className="absolute -top-2 -right-3 min-w-5 h-5 px-1 rounded-full bg-[#1f4b99] text-white text-[10px] leading-5 font-bold text-center">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </div>
              );
            })}

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
              <div className="relative" ref={accountDesktopRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileMenuOpen(false);
                    setOpen((v) => !v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      setMobileMenuOpen(false);
                      setOpen((v) => !v);
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-[#1f4b99] flex items-center justify-center text-white font-bold shadow-sm border border-[#1f4b99]/10 cursor-pointer hover:bg-[#163a79] focus:outline-none focus:ring-2 focus:ring-[#1f4b99]/30 relative z-60 pointer-events-auto"
                >
                  {userInitial || "U"}
                </button>

                {open && (
                  <div className="absolute right-0 mt-3 w-56 rounded-xl bg-white border border-slate-200 shadow-lg z-60 pointer-events-auto">
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

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center space-x-4">
            {/* Hamburger always visible */}
            <button
              type="button"
              ref={hamburgerButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen((v) => {
                  if (!v)
                    setOpen(false); // opening hamburger -> close account
                  else setOpen(false); // closing hamburger
                  return !v;
                });
              }}
              className="p-2 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1f4b99]/30 relative z-60 pointer-events-auto"
              aria-label="Open menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            {/* Account icon only if authenticated */}
            {status === "authenticated" && (
              <div className="relative" ref={accountMobileRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen((v) => {
                      if (!v)
                        setMobileMenuOpen(false); // opening mobile account -> close hamburger
                      else setMobileMenuOpen(false); // closing mobile account
                      return !v;
                    });
                  }}
                  className="w-8 h-8 rounded-full bg-[#1f4b99] flex items-center justify-center text-white font-bold shadow-sm border border-[#1f4b99]/10 cursor-pointer hover:bg-[#163a79] focus:outline-none focus:ring-2 focus:ring-[#1f4b99]/30 text-sm"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  aria-label="Account menu"
                >
                  {userInitial || "U"}
                </button>
                {open && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white border border-slate-200 shadow-lg z-50">
                    <div className="px-3 py-2 border-b border-slate-200">
                      <p className="text-xs font-semibold text-slate-900">
                        Signed in as
                      </p>
                      <p className="text-xs font-semibold text-slate-500 truncate">
                        {session.user?.name || session.user?.email}
                      </p>
                    </div>
                    <div className="py-1">
                      {isAdminRoute ? (
                        <Link
                          href="/admin/questions"
                          className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => setOpen(false)}
                        >
                          Questions
                        </Link>
                      ) : (
                        dropdownLinks.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
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
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-50">
              <div
                ref={mobileMenuRef}
                className="absolute right-4 mt-14 w-48 max-w-[90vw] rounded-lg bg-white border border-slate-200 shadow-lg z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-slate-200 flex justify-between items-center">
                  <h2 className="text-xs font-semibold text-slate-900">Menu</h2>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="py-1">
                  {linksToRender.map((link) => {
                    const isCart = !isAdminRoute && link.href === "/cart";
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>{link.label}</span>
                        {isCart && cartCount > 0 && (
                          <span className="inline-flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-[#1f4b99] text-white text-[10px] font-bold">
                            {cartCount > 99 ? "99+" : cartCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                  {status === "loading" && (
                    <div className="py-2 px-4 text-sm text-slate-500">
                      Loading...
                    </div>
                  )}
                  {status === "unauthenticated" && (
                    <div className="space-y-1">
                      <Link
                        href="/login"
                        className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        className="block px-4 py-2 text-sm bg-[#1f4b99] text-white hover:bg-[#163a79] hover:text-white focus:text-white active:text-white visited:text-white focus-visible:text-white rounded-full text-center font-semibold shadow-sm mx-4"
                        style={{ color: "#ffffff" }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Scroll to top button (visible on all viewports) */}
      {showScrollTop && !isChatOpen && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          title="Scroll to top"
          aria-label="Scroll to top"
          className="fixed z-100 bottom-5 right-20 lg:bottom-8 lg:right-24 bg-[#1f4b99] text-white rounded-full p-3 shadow-lg hover:bg-[#163a79] transition-transform transform-gpu hover:scale-105"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      )}
    </>
  );
}
