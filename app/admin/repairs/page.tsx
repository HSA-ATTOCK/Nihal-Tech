"use client";

import { useEffect, useState } from "react";

type Repair = {
  id: string;
  phoneModel: string;
  issue: string;
  status: string;
  date: string;
  createdAt: string;
  user?: { email: string };
};

const statusOptions = ["Pending", "In Progress", "Completed", "Cancelled"];

function toLocalInput(dateString: string) {
  const d = new Date(dateString);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function nowInputMin() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function Repairs() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [editDateTime, setEditDateTime] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/repair", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load repairs");
        const data = await res.json();
        setRepairs(data);
        const mapped: Record<string, string> = {};
        data.forEach((r: Repair) => {
          mapped[r.id] = toLocalInput(r.date);
        });
        setEditDateTime(mapped);
      } catch {
        setError("Could not load repairs");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setSavingId(id);
    setError("");
    try {
      const res = await fetch("/api/repair", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      const updated = await res.json();
      setRepairs((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: updated.status } : r)),
      );
    } catch {
      setError("Unable to update status");
    } finally {
      setSavingId(null);
    }
  };

  const updateAppointment = async (id: string) => {
    const dateValue = editDateTime[id];
    if (!dateValue) {
      setError("Select a date and time");
      return;
    }

    setSavingId(id);
    setError("");
    try {
      const res = await fetch("/api/repair", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, date: dateValue }),
      });

      if (!res.ok) throw new Error("Failed to update appointment");

      const updated = await res.json();
      setRepairs((prev) =>
        prev.map((r) => (r.id === id ? { ...r, date: updated.date } : r)),
      );
    } catch {
      setError("Unable to update appointment");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-600">
        Loading repairs...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Admin
            </p>
            <h2 className="text-3xl font-bold text-slate-900">
              Repair Bookings
            </h2>
          </div>
          {error && <span className="text-sm text-rose-600">{error}</span>}
        </div>

        {repairs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            No repair bookings found.
          </div>
        ) : (
          <div className="grid gap-4">
            {repairs.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-slate-900 font-semibold">
                      {r.phoneModel} — {r.issue}
                    </p>
                    <p className="text-sm text-slate-600">
                      {r.user?.email || "Unknown user"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Appointment: {new Date(r.date).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">
                      Booked on {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1f4b99] focus:outline-none"
                      disabled={savingId === r.id}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-slate-500">Current</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <input
                    type="datetime-local"
                    value={editDateTime[r.id] || ""}
                    onChange={(e) =>
                      setEditDateTime((prev) => ({
                        ...prev,
                        [r.id]: e.target.value,
                      }))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1f4b99] focus:outline-none"
                    min={nowInputMin()}
                    disabled={savingId === r.id}
                  />
                  <button
                    type="button"
                    onClick={() => updateAppointment(r.id)}
                    disabled={savingId === r.id}
                    className="rounded-lg bg-[#1f4b99] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1b3f82] disabled:opacity-50"
                  >
                    {savingId === r.id ? "Saving..." : "Update appointment"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
