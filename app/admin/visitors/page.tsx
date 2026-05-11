import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function formatLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
      <p className="mt-1 text-sm text-slate-600">{subtext}</p>
    </div>
  );
}

export default async function VisitorsPage() {
  const user = await requireAdmin();
  if (!user) return redirect("/");

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = daysAgo(6);
  const monthStart = daysAgo(29);

  const [
    totalVisitors,
    todayVisitors,
    weekVisitors,
    monthVisitors,
    visitorRows,
  ] = await Promise.all([
    prisma.visitor.count(),
    prisma.visitor.count({ where: { firstSeenAt: { gte: todayStart } } }),
    prisma.visitor.count({ where: { firstSeenAt: { gte: weekStart } } }),
    prisma.visitor.count({ where: { firstSeenAt: { gte: monthStart } } }),
    prisma.visitor.findMany({
      orderBy: { firstSeenAt: "desc" },
      take: 250,
    }),
  ]);

  const topPagesMap = new Map<string, number>();
  for (const visitor of visitorRows) {
    const page = visitor.path || "/";
    topPagesMap.set(page, (topPagesMap.get(page) || 0) + 1);
  }

  const topPages = [...topPagesMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const trend = [];
  for (let i = 6; i >= 0; i -= 1) {
    const dayStart = startOfDay(daysAgo(i));
    const nextDay = new Date(dayStart);
    nextDay.setDate(nextDay.getDate() + 1);
    const count = await prisma.visitor.count({
      where: {
        firstSeenAt: {
          gte: dayStart,
          lt: nextDay,
        },
      },
    });
    trend.push({ label: formatLabel(dayStart), count });
  }

  const peak = Math.max(...trend.map((item) => item.count), 1);

  const recentVisitors = await prisma.visitor.findMany({
    orderBy: { firstSeenAt: "desc" },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-sky-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Visitor Intelligence
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Visitor Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                One unique log per browser, with daily, weekly, and monthly
                growth so you can see how your website is performing.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-md">
              Public unique visitors only
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="All time"
            value={totalVisitors.toLocaleString()}
            subtext="Unique browsers ever recorded"
          />
          <StatCard
            label="Today"
            value={todayVisitors.toLocaleString()}
            subtext="Visitors since midnight"
          />
          <StatCard
            label="Last 7 days"
            value={weekVisitors.toLocaleString()}
            subtext="Rolling week unique visitors"
          />
          <StatCard
            label="Last 30 days"
            value={monthVisitors.toLocaleString()}
            subtext="Monthly growth snapshot"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  7 Day Trend
                </h2>
                <p className="text-sm text-slate-600">
                  Unique first-time visits by day.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {trend.map((item) => {
                const width = Math.max(
                  (item.count / peak) * 100,
                  item.count > 0 ? 8 : 4,
                );
                return (
                  <div
                    key={item.label}
                    className="grid grid-cols-[120px_1fr_48px] items-center gap-3"
                  >
                    <div className="text-sm text-slate-600">{item.label}</div>
                    <div className="h-3 rounded-full bg-slate-100">
                      <div
                        className="h-3 rounded-full bg-linear-to-r from-sky-500 to-cyan-400 transition-all"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <div className="text-right text-sm font-semibold text-slate-900">
                      {item.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Top Landing Pages
            </h2>
            <p className="text-sm text-slate-600">
              The first page each visitor opened.
            </p>
            <div className="mt-6 space-y-4">
              {topPages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  No public visits recorded yet.
                </div>
              ) : (
                topPages.map(([page, count]) => (
                  <div
                    key={page}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="truncate text-sm font-medium text-slate-900">
                        {page}
                      </div>
                    </div>
                    <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                      {count}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Visitor Logs
              </h2>
              <p className="text-sm text-slate-600">
                First visit only, with the original landing page and browser
                data.
              </p>
            </div>
            <div className="text-sm text-slate-500">
              Showing latest {Math.min(recentVisitors.length, 50)}
            </div>
          </div>

          <div className="mt-6 overflow-auto">
            <table className="w-full min-w-230 text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <th className="py-3 pr-4">First Seen</th>
                  <th className="py-3 pr-4">Landing Page</th>
                  <th className="py-3 pr-4">IP</th>
                  <th className="py-3 pr-4">Referrer</th>
                  <th className="py-3 pr-4">Lang</th>
                </tr>
              </thead>
              <tbody>
                {recentVisitors.map((visitor) => (
                  <tr
                    key={visitor.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-4 pr-4 text-sm text-slate-700">
                      {new Date(visitor.firstSeenAt).toLocaleString()}
                    </td>
                    <td className="py-4 pr-4 text-sm font-medium text-slate-900">
                      {visitor.path || "/"}
                    </td>
                    <td className="py-4 pr-4 text-sm text-slate-700">
                      {visitor.ip}
                    </td>
                    <td className="py-4 pr-4 text-sm text-slate-700">
                      {visitor.referrer || "-"}
                    </td>
                    <td className="py-4 pr-4 text-sm text-slate-700">
                      {visitor.lang}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
