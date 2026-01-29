import Link from "next/link";

const actions = [
  {
    title: "Manage Products",
    href: "/admin/products",
    desc: "Add, edit, and remove products",
    icon: "📦",
  },
  {
    title: "Repair Bookings",
    href: "/admin/repairs",
    desc: "View and update all repair requests",
    icon: "🛠",
  },
  {
    title: "Orders",
    href: "/admin/orders",
    desc: "Track payments and fulfillment",
    icon: "📑",
  },
  {
    title: "Users",
    href: "/admin/users",
    desc: "Manage customer and admin accounts",
    icon: "👥",
  },
  {
    title: "Questions",
    href: "/admin/questions",
    desc: "Answer customer product questions",
    icon: "❓",
  },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Admin
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Control Panel</h1>
          <p className="text-slate-600 mt-1">
            Manage products, repairs, orders, and users from one place.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#1f4b99] transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-slate-900 font-semibold text-lg mb-1">
                {item.title}
              </h3>
              <p className="text-slate-600 text-sm">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
