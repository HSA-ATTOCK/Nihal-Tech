"use client";

import Container from "@/components/Container";
import Button from "@/components/Button";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  imageUrls?: string[];
}

export default function Home() {
  const router = useRouter();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((res) => (res.ok ? res.json() : [])),
      fetch("/api/recently-viewed/count").then((res) =>
        res.ok ? res.json() : {},
      ),
    ])
      .then(([products, viewCounts]: [Product[], Record<string, number>]) => {
        const sorted = (products || []).sort((a, b) => {
          const aCount = viewCounts[a.id] || 0;
          const bCount = viewCounts[b.id] || 0;
          if (aCount !== bCount) return bCount - aCount;
          return a.price - b.price;
        });
        setFeaturedProducts(sorted.slice(0, 4));
      })
      .catch(() => {});
  }, []);
  return (
    <div className="pb-16">
      <div className="bg-linear-to-br from-white via-[#eef2f9] to-[#e1e9fb] border-b border-slate-200">
        <Container>
          <div className="grid lg:grid-cols-2 gap-10 items-center py-16">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-[#1f4b99]">
                Trusted repairs • Business ready
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-slate-900">
                Devices, accessories, and expert repairs built for modern teams.
              </h1>
              <p className="text-lg text-slate-600 max-w-xl">
                Nihal Tech keeps your phones, laptops, and accessories running
                with fast delivery, certified technicians, and transparent
                service.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/shop">
                  <Button className="text-base px-6 py-3">Shop devices</Button>
                </Link>
                <Link href="/repair-booking">
                  <button className="px-6 py-3 rounded-lg border border-slate-300 text-[#1f4b99] font-semibold bg-white shadow-sm hover:border-[#1f4b99] transition-colors">
                    Book a repair
                  </button>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
                {["24h dispatch", "90-day warranty", "UK-wide pickup"].map(
                  (item) => (
                    <div
                      key={item}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl bg-white shadow-lg border border-slate-200 p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-900">
                      Fleet overview
                    </h3>
                  </div>
                  <span className="rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 border border-emerald-100">
                    On track
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Devices under care</p>
                    <p className="text-3xl font-bold text-slate-900">328</p>
                    <p className="text-xs text-emerald-600 font-semibold">
                      +18 this month
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Avg repair time</p>
                    <p className="text-3xl font-bold text-slate-900">22h</p>
                    <p className="text-xs text-slate-500">Door-to-door</p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 bg-linear-to-r from-[#1f4b99]/8 to-[#163a79]/5">
                  <p className="text-sm font-semibold text-slate-900">
                    Priority services
                  </p>
                  <p className="text-sm text-slate-600">
                    Same-day diagnostics, advance replacements, business
                    billing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="grid gap-6 lg:grid-cols-3 mt-10">
          {[
            {
              title: "Certified repairs",
              desc: "Manufacturer-grade parts and diagnostics backed by a 90-day warranty.",
              icon: "🛠️",
            },
            {
              title: "Business delivery",
              desc: "UK-wide delivery with real-time tracking and optional white-glove setup.",
              icon: "🚚",
            },
            {
              title: "Lifecycle coverage",
              desc: "Procurement to recycling with clear SLAs and proactive support.",
              icon: "📦",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="text-2xl mb-3">{card.icon}</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {card.title}
              </h3>
              <p className="text-sm text-slate-600">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mt-14">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-900">
                Products preview
              </h3>
              <Link
                href="/shop"
                className="text-sm text-[#1f4b99] font-semibold"
              >
                View shop →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "New Phones",
                "Laptops & PCs",
                "Phone Accessories",
                "Laptop & PC Accessories",
              ].map((title) => (
                <div
                  key={title}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xs text-slate-500">Category</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {title}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">
                    Curated inventory with transparent pricing and next-day
                    dispatch.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-900">
                Repair preview
              </h3>
              <Link
                href="/repair-booking"
                className="text-sm text-[#1f4b99] font-semibold"
              >
                Book now →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Phones and tablets",
                "Laptops and desktops",
                "Consoles and audio",
                "Diagnostics and tune-ups",
              ].map((title) => (
                <div
                  key={title}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xs text-slate-500">Service</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {title}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">
                    Quick turnaround with genuine parts and progress updates.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.18em]">
                  Why teams choose us
                </p>
                <h3 className="text-2xl font-semibold text-slate-900 mt-1">
                  Clear processes, reliable delivery
                </h3>
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1">
                SLA backed
              </span>
            </div>
            <ul className="mt-6 space-y-3 text-slate-700">
              <li>• Structured onboarding for new devices and accessories</li>
              <li>• Door-to-door repair logistics with status notifications</li>
              <li>
                • Dedicated support and consolidated billing for businesses
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-[#1f4b99]/10 via-white to-[#163a79]/5 p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">
              Need a tailored quote?
            </p>
            <p className="text-lg text-slate-600 mt-2">
              Share your device list and service requirements—we will prepare a
              focused proposal within one business day.
            </p>
            <Link
              href="/repair-booking"
              className="inline-flex items-center gap-2 mt-4 text-[#1f4b99] font-semibold"
            >
              Talk to an expert →
            </Link>
          </div>
        </div>

        {featuredProducts.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.18em]">
                  Featured
                </p>
                <h3 className="text-2xl font-semibold text-slate-900 mt-1">
                  Popular products
                </h3>
              </div>
              <Link href="/shop">
                <Button className="text-sm">More products</Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
                  aria-label={`View ${product.name}`}
                >
                  <div className="relative w-full aspect-square bg-slate-50">
                    {product.imageUrls?.[0] || product.imageUrl ? (
                      <Image
                        src={product.imageUrls?.[0] || product.imageUrl || ""}
                        alt={product.name}
                        fill
                        className="object-contain p-3"
                      />
                    ) : (
                      <div className="text-slate-500 flex items-center justify-center h-full">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="px-2 py-2">
                    <h4
                      className="text-xs font-semibold text-slate-900 line-clamp-2 overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {product.name}
                    </h4>
                    <p className="text-[#1f4b99] font-semibold text-sm mt-1">
                      £{product.price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
