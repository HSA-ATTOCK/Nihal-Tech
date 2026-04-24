import Link from "next/link";

export default function KidsPromoBanner() {
  return (
    <Link href="/shop?category=Kids%20Section" className="block">
      <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-linear-to-r from-amber-400 via-rose-400 to-fuchsia-500 px-5 py-5 shadow-sm transition hover:shadow-md sm:px-6">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-8 top-0 h-24 w-24 rounded-full bg-white/40 blur-2xl" />
          <div className="absolute right-8 bottom-0 h-28 w-28 rounded-full bg-white/30 blur-2xl" />
        </div>
        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/90">
              Kids Section
            </p>
            <h3 className="text-2xl font-black sm:text-3xl">
              Special prices on kids essentials
            </h3>
            <p className="max-w-2xl text-sm text-white/90 sm:text-base">
              Find bright deals on kids products with limited-time savings and
              family-friendly picks.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-rose-600 shadow-sm">
            Explore kids deals →
          </div>
        </div>
      </div>
    </Link>
  );
}
